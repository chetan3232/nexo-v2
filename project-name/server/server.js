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

// Initialize Storage (Create JSON files if missing)
store.initializeData();

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Rate limiting middleware to prevent abuse (Max 200 requests per 15 minutes per IP)
const rateLimits = new Map();
const rateLimiter = (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutes
    const maxRequests = 200;
    
    if (!rateLimits.has(ip)) {
        rateLimits.set(ip, []);
    }
    
    const timestamps = rateLimits.get(ip).filter(t => now - t < windowMs);
    timestamps.push(now);
    rateLimits.set(ip, timestamps);
    
    if (timestamps.length > maxRequests) {
        return res.status(429).json({ error: 'Too many requests, please try again later.' });
    }
    next();
};

app.use('/api', rateLimiter);

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

app.get('/', (req, res) => {
    res.send('AI Code Editor Backend Running');
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
