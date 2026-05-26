const { registerWorker } = require('./queueManager');
const BackendOrchestrator = require('./backendOrchestrator');

const startWorker = () => {
    console.log('[BackgroundWorker] Registering worker queue listener...');
    registerWorker(async (job) => {
        console.log(`[BackgroundWorker] Processing job ${job.id} for chatId: ${job.data.chatId}`);
        await BackendOrchestrator.runWorkflow(job);
    });
};

module.exports = {
    startWorker
};
