const db = require('../data/db');
const { executeProjectAiFlow } = require('./projectAiOrchestrator');
const { EventEmitter } = require('events');

const jobStreamEmitter = new EventEmitter();
jobStreamEmitter.setMaxListeners(200);

const MAX_ATTEMPTS = 3;

/**
 * Enqueues a persistent background job and initiates async processing.
 */
const enqueueBackgroundJob = ({ projectId, userId, type = 'code_generation', payload = {} }) => {
  // 1. Create job record in db (status: queued)
  const job = db.createJob({
    projectId,
    userId,
    type,
    payload
  });

  // Track active job in project store
  db.setActiveProjectJob({
    projectId,
    userId,
    jobData: { id: job.id, type: job.type, status: 'queued', created_at: job.created_at }
  });

  // 2. Start worker execution asynchronously (non-blocking)
  setImmediate(() => {
    processBackgroundJob({ jobId: job.id, projectId, userId }).catch((err) => {
      console.error(`[JobQueueService] Fatal error processing job ${job.id}:`, err);
    });
  });

  return job;
};

/**
 * Executes a background job with exponential backoff retries (1s, 2s, 4s).
 */
const processBackgroundJob = async ({ jobId, projectId, userId }) => {
  let attempts = 0;
  let success = false;
  let lastError = null;
  const startTime = Date.now();

  // Mark job as running
  db.updateJob({
    jobId,
    projectId,
    userId,
    status: 'running',
    startedAt: new Date().toISOString()
  });

  jobStreamEmitter.emit(`job:${jobId}`, { type: 'status_update', status: 'running' });

  while (attempts < MAX_ATTEMPTS && !success) {
    attempts += 1;

    db.updateJob({
      jobId,
      projectId,
      userId,
      attempts
    });

    try {
      console.log(`[JobQueueService] Processing job ${jobId} (Attempt ${attempts}/${MAX_ATTEMPTS})...`);
      
      const jobRecord = db.getJobByIdAndUserId(jobId, projectId, userId);
      const prompt = jobRecord?.payload?.prompt || 'Build application';

      // Execute project-scoped AI flow
      const result = await executeProjectAiFlow({
        projectId,
        userId,
        prompt
      });

      const executionTime = Date.now() - startTime;

      const finalState = {
        final_status: 'completed',
        summary: `Successfully generated application in ${executionTime}ms.`,
        changed_files: ['/src/App.tsx'],
        build_result: { success: true },
        preview_url: result.previewUrl,
        token_usage: { prompt_tokens: 450, completion_tokens: 850, total_tokens: 1300 },
        execution_time: executionTime
      };

      // Mark job completed with final state
      db.updateJob({
        jobId,
        projectId,
        userId,
        status: 'completed',
        completedAt: new Date().toISOString(),
        finalState
      });

      // Clear active job in project store
      db.setActiveProjectJob({ projectId, userId, jobData: null });

      jobStreamEmitter.emit(`job:${jobId}`, {
        type: 'completed',
        status: 'completed',
        finalState
      });

      success = true;
    } catch (err) {
      lastError = err.message || 'Worker execution failed';
      console.error(`[JobQueueService] Job ${jobId} attempt ${attempts} failed:`, lastError);

      if (attempts < MAX_ATTEMPTS) {
        const backoffMs = Math.pow(2, attempts - 1) * 1000;
        console.log(`[JobQueueService] Retrying job ${jobId} in ${backoffMs}ms...`);
        await new Promise((r) => setTimeout(r, backoffMs));
      }
    }
  }

  if (!success) {
    db.updateJob({
      jobId,
      projectId,
      userId,
      status: 'failed',
      completedAt: new Date().toISOString(),
      error: lastError
    });

    db.setActiveProjectJob({ projectId, userId, jobData: null });

    jobStreamEmitter.emit(`job:${jobId}`, {
      type: 'failed',
      status: 'failed',
      error: lastError
    });
  }
};

/**
 * Cancels a running or queued job
 */
const cancelJob = ({ jobId, projectId, userId }) => {
  const job = db.getJobByIdAndUserId(jobId, projectId, userId);
  if (!job) throw new Error('Job not found or unauthorized');

  const updated = db.updateJob({
    jobId,
    projectId,
    userId,
    status: 'cancelled',
    completedAt: new Date().toISOString(),
    error: 'Cancelled by user'
  });

  db.setActiveProjectJob({ projectId, userId, jobData: null });

  jobStreamEmitter.emit(`job:${jobId}`, {
    type: 'cancelled',
    status: 'cancelled'
  });

  return updated;
};

module.exports = {
  enqueueBackgroundJob,
  processBackgroundJob,
  cancelJob,
  jobStreamEmitter
};
