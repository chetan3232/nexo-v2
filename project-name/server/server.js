require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env.local') });

const express = require('express');
const cors = require('cors');
const store = require('./data/store');
const fileRoutes = require('./routes/files');
const chatRoutes = require('./routes/chats');
const deployRoutes = require('./routes/deploy');
const aiRoutes = require('./routes/ai');
const scrapeRoutes = require('./routes/scrape');

const app = express();
const PORT = 5000;

const compression = require('compression');
app.use(compression());

// Initialize Storage (Create JSON files if missing)
store.initializeData();

// Import and Initialize Background Worker Queue
const { initQueue } = require('./services/queueManager');
const { startWorker } = require('./services/backgroundWorker');

initQueue().then(() => {
    startWorker();
}).catch(err => {
    console.error('Queue initialization failed:', err);
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Note: AI-specific rate limiting is handled inside aiGateway.js via rate-limiter-flexible.

// Routes
app.use('/api/files', fileRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/deploy', deployRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/scrape', scrapeRoutes);

app.get('/api/usage', (req, res) => {
    const path = require('path');
    const fs = require('fs');
    const logPath = path.join(__dirname, './data/usage.json');
    if (fs.existsSync(logPath)) {
        res.json(JSON.parse(fs.readFileSync(logPath)));
    } else {
        res.json({ calls: [], totalTokens: 0 });
    }
});

app.get('/api/allowance', (req, res) => {
    const userId = req.headers["x-user-id"] || "anonymous";
    const email = req.headers["x-user-email"] || "";
    const allowanceManager = require('./services/allowanceManager');
    const userAllowance = allowanceManager.checkAllowance(userId, email);
    res.json(userAllowance);
});

app.get('/', (req, res) => {
    res.send('AI Code Editor Backend Running');
});

// Error handling - never expose stack traces to clients
app.use((err, req, res, next) => {
    console.error('[Server Error]', err.message, err.stack);
    res.status(500).json({ error: 'An internal server error occurred.' });
});

const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

const { flushSync } = require('./data/jobStore');
const { closeQueue } = require('./services/queueManager');

const gracefulShutdown = () => {
    console.log('\n[Server] Shutdown signal received. Starting graceful shutdown...');
    server.close(async () => {
        console.log('[Server] HTTP server closed.');
        flushSync();
        await closeQueue();
        console.log('[Server] Graceful shutdown completed. Exiting process.');
        process.exit(0);
    });

    setTimeout(() => {
        console.error('[Server] Graceful shutdown timed out. Force exiting.');
        flushSync();
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
