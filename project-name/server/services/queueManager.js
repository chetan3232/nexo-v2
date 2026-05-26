const { Queue, Worker } = require('bullmq');
const Redis = require('ioredis');
const { EventEmitter } = require('events');
const { saveJob, getJob, initializeJobs } = require('../data/jobStore');

initializeJobs();

const jobEvents = new EventEmitter();
// Max listeners limit increase to prevent memory leak warnings with many clients
jobEvents.setMaxListeners(100);

let useRedis = false;
let redisConnection = null;
let bullQueue = null;
let bullWorker = null;

// Simple in-memory queue implementation
class InMemoryQueue {
    constructor() {
        this.jobs = [];
        this.active = false;
        this.workerFn = null;
    }

    setWorker(workerFn) {
        this.workerFn = workerFn;
        this.processNext();
    }

    async add(name, data, opts = {}) {
        const jobId = opts.jobId || `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const job = {
            id: jobId,
            name,
            data,
            progress: 0,
            log: [],
            status: 'planning'
        };
        
        // Save initial state to DB
        saveJob(jobId, {
            id: jobId,
            chatId: data.chatId,
            prompt: data.prompt,
            status: 'planning',
            progress: 0,
            tasks: [],
            reasoningSteps: [],
            files: {},
            logs: [],
            createdAt: Date.now()
        });

        this.jobs.push(job);
        
        // Run process loop
        this.processNext();

        return { id: jobId };
    }

    async processNext() {
        if (this.active || this.jobs.length === 0 || !this.workerFn) return;
        this.active = true;
        const job = this.jobs.shift();
        
        try {
            const jobWrapper = createJobWrapper(job.id, job.data);
            await this.workerFn(jobWrapper);
        } catch (err) {
            console.error(`[In-Memory Worker] Job ${job.id} failed:`, err);
        } finally {
            this.active = false;
            this.processNext();
        }
    }
}

const inMemoryQueue = new InMemoryQueue();

// Create a unified job wrapper that handles DB updates and SSE notifications
function createJobWrapper(jobId, jobData) {
    return {
        id: jobId,
        data: jobData,
        
        updateStatus: (status, extraData = {}) => {
            const current = getJob(jobId) || {};
            const updated = saveJob(jobId, { status, ...extraData });
            jobEvents.emit(jobId, { type: 'status_update', status, ...extraData });
            return updated;
        },
        
        updateProgress: (progress) => {
            const updated = saveJob(jobId, { progress });
            jobEvents.emit(jobId, { type: 'progress_update', progress });
            return updated;
        },
        
        updateTasks: (tasks) => {
            const updated = saveJob(jobId, { tasks });
            jobEvents.emit(jobId, { type: 'tasks_update', tasks });
            return updated;
        },

        addReasoningStep: (step) => {
            const current = getJob(jobId) || {};
            const reasoningSteps = [...(current.reasoningSteps || []), step];
            const updated = saveJob(jobId, { reasoningSteps });
            jobEvents.emit(jobId, { type: 'reasoning_update', step });
            return updated;
        },
        
        updateFiles: (files) => {
            const current = getJob(jobId) || {};
            const mergedFiles = { ...(current.files || {}), ...files };
            const updated = saveJob(jobId, { files: mergedFiles });
            jobEvents.emit(jobId, { type: 'files_update', files });
            return updated;
        },

        log: (message) => {
            const current = getJob(jobId) || {};
            const logs = [...(current.logs || []), message];
            const updated = saveJob(jobId, { logs });
            jobEvents.emit(jobId, { type: 'log', message });
            return updated;
        },

        complete: (summary, fileCount, extraData = {}) => {
            const updated = saveJob(jobId, { 
                status: 'completed', 
                progress: 100,
                summary,
                fileCount,
                ...extraData
            });
            jobEvents.emit(jobId, { type: 'done', summary, fileCount, ...extraData });
            return updated;
        },

        fail: (errorMessage) => {
            const updated = saveJob(jobId, { status: 'failed', error: errorMessage });
            jobEvents.emit(jobId, { type: 'error', error: errorMessage });
            return updated;
        }
    };
}

// Check Redis availability
const initQueue = async () => {
    try {
        console.log('[QueueManager] Checking Redis connection...');
        const tempRedis = new Redis({
            host: process.env.REDIS_HOST || '127.0.0.1',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            maxRetriesPerRequest: 1,
            connectTimeout: 2000
        });

        // Register error listener to suppress uncaught/unhandled connection refused exceptions
        tempRedis.on('error', (err) => {
            // expected when Redis is not running locally
        });

        await new Promise((resolve, reject) => {
            tempRedis.ping((err, res) => {
                if (err) reject(err);
                else resolve(res);
            });
        });

        // Disconnect tempRedis if successfully connected since we verified connection
        tempRedis.disconnect();

        redisConnection = new Redis({
            host: process.env.REDIS_HOST || '127.0.0.1',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            maxRetriesPerRequest: null // Required by BullMQ
        });
        redisConnection.on('error', (err) => {
            console.error('[QueueManager] Redis connection error:', err);
        });
        useRedis = true;
        console.log('\x1b[32m[QueueManager] Redis detected. Using BullMQ.\x1b[0m');

        bullQueue = new Queue('nexo-build-queue', { connection: redisConnection });
    } catch (err) {
        console.log('\x1b[33m[QueueManager] Redis not available or failed. Falling back to In-Memory Queue.\x1b[0m');
        useRedis = false;
    }
};

const addJob = async (name, data, jobId) => {
    if (useRedis && bullQueue) {
        // Save initial state in DB
        saveJob(jobId, {
            id: jobId,
            chatId: data.chatId,
            prompt: data.prompt,
            status: 'planning',
            progress: 0,
            tasks: [],
            reasoningSteps: [],
            files: {},
            logs: [],
            createdAt: Date.now()
        });

        await bullQueue.add(name, data, { jobId });
        return { id: jobId };
    } else {
        return await inMemoryQueue.add(name, data, { jobId });
    }
};

const registerWorker = (workerFn) => {
    if (useRedis && redisConnection) {
        bullWorker = new Worker('nexo-build-queue', async (bullJob) => {
            console.log(`[BullMQ Worker] Starting job: ${bullJob.id}`);
            const jobWrapper = createJobWrapper(bullJob.id, bullJob.data);
            
            // Listen to process progress and bubble it up
            await workerFn(jobWrapper);
        }, { connection: redisConnection });

        bullWorker.on('failed', (job, err) => {
            console.error(`[BullMQ Worker] Job ${job.id} failed:`, err);
            const jobWrapper = createJobWrapper(job.id, job.data);
            jobWrapper.fail(err.message || 'Worker task failed');
        });
    } else {
        inMemoryQueue.setWorker(workerFn);
    }
};

module.exports = {
    initQueue,
    addJob,
    registerWorker,
    jobEvents,
    getJob
};
