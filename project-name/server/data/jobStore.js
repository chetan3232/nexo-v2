const fs = require('fs');
const path = require('path');

const JOBS_FILE = path.join(__dirname, 'jobs.json');

const initializeJobs = () => {
    if (!fs.existsSync(JOBS_FILE)) {
        fs.writeFileSync(JOBS_FILE, JSON.stringify({ jobs: {} }));
    }
};

const readJobs = () => {
    try {
        if (!fs.existsSync(JOBS_FILE)) {
            initializeJobs();
        }
        const data = fs.readFileSync(JOBS_FILE, 'utf8');
        return JSON.parse(data).jobs;
    } catch (e) {
        return {};
    }
};

const writeJobs = (jobs) => {
    fs.writeFileSync(JOBS_FILE, JSON.stringify({ jobs }, null, 2));
};

const getJob = (jobId) => {
    const jobs = readJobs();
    return jobs[jobId] || null;
};

const saveJob = (jobId, jobData) => {
    const jobs = readJobs();
    jobs[jobId] = {
        ...jobs[jobId],
        ...jobData,
        updatedAt: Date.now()
    };
    writeJobs(jobs);
    return jobs[jobId];
};

module.exports = {
    initializeJobs,
    readJobs,
    writeJobs,
    getJob,
    saveJob
};
