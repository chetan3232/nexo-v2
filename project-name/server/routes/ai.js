const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const { z } = require("zod");
const { RateLimiterMemory } = require("rate-limiter-flexible");
const AIGateway = require("../services/aiGateway");
const { addJob, jobEvents, getJob } = require("../services/queueManager");

// Validation Schema for Trigger Build API
const buildRequestSchema = z.object({
    prompt: z.string().min(1, "Prompt cannot be empty").max(10000, "Prompt is too long"),
    chatId: z.string().min(1, "Chat ID cannot be empty"),
    options: z.object({
        model: z.string().optional(),
        projectMode: z.enum(["frontend", "fullstack"]).optional(),
        techStack: z.string().optional(),
        selectedLanguage: z.string().optional(),
        temperature: z.number().min(0).max(2).optional(),
        topP: z.number().min(0).max(1).optional()
    }).optional()
});

// Rate limiting on builds: Max 5 builds per 2 minutes per IP
const buildRateLimiter = new RateLimiterMemory({
    points: 5,
    duration: 2 * 60,
});

router.post("/chat", AIGateway.handleRequest);

// 1. Trigger background job build
router.post("/build", async (req, res) => {
    try {
        const ip = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress;

        // 1. Apply rate limiter
        try {
            await buildRateLimiter.consume(ip);
        } catch (rejRes) {
            return res.status(429).json({ error: "Too many project builds triggered. Please wait a moment before trying again." });
        }

        // 2. Input Validation via Zod
        const parsed = buildRequestSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ 
                error: "Invalid request parameters", 
                details: parsed.error.format() 
            });
        }

        const { prompt, chatId, options } = parsed.data;
        const jobId = `build_${uuidv4()}`;
        console.log(`[Routes AI] Queueing job ${jobId} for chatId ${chatId}...`);
        
        await addJob("build-app", {
            prompt,
            chatId,
            options: options || {}
        }, jobId);

        res.json({ jobId });
    } catch (err) {
        console.error("[Routes AI] Trigger build failed:", err);
        res.status(500).json({ error: err.message || "Failed to trigger background build" });
    }
});

// 2. Stream job execution events (SSE)
router.get("/stream/:jobId", (req, res) => {
    const { jobId } = req.params;
    const job = getJob(jobId);

    // Set SSE Headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    // 1. Send History/Catch-up data
    if (job) {
        res.write(`data: ${JSON.stringify({ type: 'history', job })}\n\n`);
        
        // If the job is already finished, terminate immediately
        if (job.status === 'completed' || job.status === 'failed') {
            res.write(`data: ${JSON.stringify({ type: 'done_history', job })}\n\n`);
            setTimeout(() => {
                if (!res.writableEnded) res.end();
            }, 100);
            return;
        }
    } else {
        res.write(`data: ${JSON.stringify({ type: 'error', error: 'Job not found' })}\n\n`);
        setTimeout(() => {
            if (!res.writableEnded) res.end();
        }, 100);
        return;
    }

    // 2. Subscribe to live updates
    const onJobEvent = (event) => {
        if (!res.writableEnded) {
            res.write(`data: ${JSON.stringify(event)}\n\n`);
            
            // End stream on completion or failure
            if (event.type === 'done' || event.type === 'error') {
                setTimeout(() => {
                    if (!res.writableEnded) res.end();
                }, 100);
            }
        }
    };

    jobEvents.on(jobId, onJobEvent);

    // Cleanup on client disconnect
    req.on("close", () => {
        jobEvents.off(jobId, onJobEvent);
    });
});

// 3. Fetch single job status
router.get("/job/:jobId", (req, res) => {
    const { jobId } = req.params;
    const job = getJob(jobId);
    if (!job) {
        return res.status(404).json({ error: "Job not found" });
    }
    res.json(job);
});

module.exports = router;
