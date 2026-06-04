const express = require('express');
const router = express.Router();

router.post('/', async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        const userId = req.headers["x-user-id"] || "anonymous";
        const email = req.headers["x-user-email"] || "";

        // Check allowance balance before scraping
        const allowanceManager = require('../services/allowanceManager');
        const userAllowance = allowanceManager.checkAllowance(userId, email);
        if (userAllowance.balance <= 0) {
            const isAnonymous = !userId || userId === 'anonymous';
            const limitMsg = isAnonymous
                ? "You have exceeded your anonymous free allowance ($0.50). Please sign in to get a $5.00 free allowance."
                : "You have exceeded your free allowance ($5.00). Allowance resets every 2 days.";
            return res.status(403).json({ error: limitMsg });
        }

        const apiKey = process.env.FIRECRAWL_API_KEY;
        if (!apiKey) {
            return res.status(401).json({ error: 'Firecrawl API key is missing in backend (.env.local).' });
        }

        console.log(`[Scraper] Scraping URL: ${url} using Firecrawl...`);

        const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                url: url,
                formats: ['markdown', 'screenshot']
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Firecrawl API error: ${response.status} - ${errText}`);
        }

        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'Scraping failed');
        }

        console.log(`[Scraper] Scraped successfully! Length: ${data.data.markdown?.length || 0}`);

        res.json({
            success: true,
            markdown: data.data.markdown,
            screenshot: data.data.screenshot || '',
            metadata: data.data.metadata || {}
        });

    } catch (error) {
        console.error('Scraping Error:', error.message);
        res.status(500).json({ error: error.message || 'Failed to scrape website' });
    }
});

module.exports = router;
