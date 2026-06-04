const fs = require('fs');
const path = require('path');

const JOBS_FILE = path.join(__dirname, 'jobs.json');
let jobsCache = {};
let writeTimeout = null;
let isWriting = false;
let hasPendingWrite = false;

const initializeJobs = () => {
    if (!fs.existsSync(JOBS_FILE)) {
        try {
            fs.writeFileSync(JOBS_FILE, JSON.stringify({ jobs: {} }));
        } catch (e) {
            console.error('[JobStore] Failed to write initial jobs.json file:', e);
        }
    }
    try {
        const data = fs.readFileSync(JOBS_FILE, 'utf8');
        jobsCache = JSON.parse(data).jobs || {};
        console.log(`[JobStore] Loaded ${Object.keys(jobsCache).length} jobs into memory cache.`);
    } catch (e) {
        console.error('[JobStore] Failed to load jobs, starting with empty cache:', e);
        jobsCache = {};
    }
};

const triggerAsyncWrite = () => {
    if (writeTimeout) return;
    writeTimeout = setTimeout(async () => {
        writeTimeout = null;
        if (isWriting) {
            hasPendingWrite = true;
            return;
        }
        await flushCacheToDisk();
    }, 500);
};

const flushCacheToDisk = async () => {
    isWriting = true;
    const tempFile = `${JOBS_FILE}.tmp`;
    const dataToSave = JSON.stringify({ jobs: jobsCache }, null, 2);
    try {
        await fs.promises.writeFile(tempFile, dataToSave, 'utf8');
        await fs.promises.rename(tempFile, JOBS_FILE);
    } catch (err) {
        console.error('[JobStore] Asynchronous atomic write failed:', err);
    } finally {
        isWriting = false;
        if (hasPendingWrite) {
            hasPendingWrite = false;
            triggerAsyncWrite();
        }
    }
};

const flushSync = () => {
    if (writeTimeout) {
        clearTimeout(writeTimeout);
        writeTimeout = null;
    }
    try {
        const tempFile = `${JOBS_FILE}.tmp`;
        const dataToSave = JSON.stringify({ jobs: jobsCache }, null, 2);
        fs.writeFileSync(tempFile, dataToSave, 'utf8');
        fs.renameSync(tempFile, JOBS_FILE);
        console.log('[JobStore] Synchronous shutdown flush completed successfully.');
    } catch (err) {
        console.error('[JobStore] Synchronous shutdown flush failed:', err);
    }
};

const getJob = (jobId) => {
    return jobsCache[jobId] || null;
};

const saveJob = (jobId, jobData) => {
    jobsCache[jobId] = {
        ...jobsCache[jobId],
        ...jobData,
        updatedAt: Date.now()
    };
    triggerAsyncWrite();
    return jobsCache[jobId];
};

module.exports = {
    initializeJobs,
    getJob,
    saveJob,
    flushSync
};
