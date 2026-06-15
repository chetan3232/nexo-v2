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
        topP: z.number().min(0).max(1).optional(),
        systemPrompt: z.string().optional(),
        enabledTools: z.array(z.string()).optional(),
        customApiKey: z.string().optional()
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
        
        const userId = req.headers["x-user-id"] || "anonymous";
        const email = req.headers["x-user-email"] || "";

        // Check allowance balance before building
        const allowanceManager = require("../services/allowanceManager");
        const userAllowance = allowanceManager.checkAllowance(userId, email);
        if (userAllowance.balance <= 0) {
            const isAnonymous = !userId || userId === 'anonymous';
            const limitMsg = isAnonymous
                ? "You have exceeded your anonymous free allowance ($0.50). Please sign in to get a $5.00 free allowance."
                : "You have exceeded your free allowance ($5.00). Allowance resets every 2 days.";
            return res.status(403).json({ error: limitMsg });
        }

        const jobId = `build_${uuidv4()}`;
        console.log(`[Routes AI] Queueing job ${jobId} for chatId ${chatId} (user: ${userId})...`);
        
        await addJob("build-app", {
            prompt,
            chatId,
            userId,
            email,
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

// 4. Speech to Text (STT) Transcription API
router.post("/transcribe", async (req, res) => {
    try {
        const { audio } = req.body;
        if (!audio) {
            return res.status(400).json({ error: "Missing audio data" });
        }

        // 1. Try Groq Whisper API (primary, extremely fast and multilingual)
        if (process.env.GROQ_API_KEY) {
            try {
                console.log("[STT] Attempting Groq Whisper transcription...");
                const formData = new FormData();
                const buffer = Buffer.from(audio, "base64");
                const file = new Blob([buffer], { type: "audio/webm" });
                formData.append("file", file, "audio.webm");
                formData.append("model", "whisper-large-v3");

                const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
                    },
                    body: formData
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.text) {
                        console.log("[STT] Groq transcription successful:", data.text);
                        return res.json({ text: data.text });
                    }
                } else {
                    const errText = await response.text();
                    console.error("[STT] Groq transcription failed with response:", errText);
                }
            } catch (groqErr) {
                console.error("[STT] Groq transcription error, falling back to Gemini:", groqErr.message);
            }
        }

        // 2. Try Gemini 2.5 Flash API (fallback, natively processes audio)
        if (process.env.GEMINI_API_KEY) {
            try {
                console.log("[STT] Attempting Gemini fallback transcription...");
                const { GoogleGenerativeAI } = require("@google/generative-ai");
                const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
                const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

                const result = await model.generateContent([
                    {
                        inlineData: {
                            data: audio,
                            mimeType: "audio/webm"
                        }
                    },
                    "Provide a clean transcription of this audio. Output only the transcription text, nothing else."
                ]);

                const text = result.response.text();
                if (text) {
                    console.log("[STT] Gemini transcription successful:", text);
                    return res.json({ text: text.trim() });
                }
            } catch (geminiErr) {
                console.error("[STT] Gemini transcription error:", geminiErr.message);
            }
        }

        res.status(500).json({ error: "Failed to transcribe audio. No available STT providers." });
    } catch (err) {
        console.error("[STT] General transcription error:", err);
        res.status(500).json({ error: err.message || "Failed to transcribe audio" });
    }
});

// 5. Intent and Design Exploration API
router.post("/explore", async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!prompt) return res.status(400).json({ error: "Missing prompt" });
        
        console.log("[Routes AI] Starting Intent & Design Exploration for:", prompt);
        if (!process.env.GEMINI_API_KEY) {
             return res.status(500).json({ error: "API Key missing" });
        }
        const { GoogleGenerativeAI } = require("@google/generative-ai");
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

        const systemPrompt = `You are an AI Product Architect. Given a user prompt, extract the intent and generate TWO distinct UI/UX design concepts.
Return ONLY valid JSON in the exact following format, without any markdown formatting or code blocks:
{
  "intent": {
    "appType": "String",
    "targetUsers": "String",
    "platform": "String",
    "features": ["Feature 1", "Feature 2", "Feature 3", "Feature 4"]
  },
  "concepts": [
    {
      "id": "A",
      "title": "String (e.g. Modern SaaS Style)",
      "description": "Short description of the concept",
      "styles": {
        "primaryColor": "Hex code e.g. #0ea5e9",
        "borderRadius": "px value e.g. 12px",
        "typography": "Font name e.g. Inter",
        "animation": "Normal or Premium"
      }
    },
    {
      "id": "B",
      "title": "String (e.g. Bold Startup Style)",
      "description": "Short description of the concept",
      "styles": {
        "primaryColor": "Hex code e.g. #ff4b3a",
        "borderRadius": "px value e.g. 24px",
        "typography": "Font name e.g. Outfit",
        "animation": "Normal or Premium"
      }
    }
  ]
}`;

        const result = await model.generateContent([
            { text: systemPrompt },
            { text: `User Prompt: ${prompt}` }
        ]);

        const text = result.response.text();
        const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const json = JSON.parse(cleanedText);
        
        res.json(json);
    } catch (err) {
        console.error("[Routes AI] Explore API failed:", err);
        res.status(500).json({ error: "Failed to generate design concepts" });
    }
});

// 6. Blueprint Generation & Editing API
router.post("/blueprint", async (req, res) => {
    try {
        const { prompt, modifications, currentBlueprint } = req.body;
        if (!prompt && !modifications) return res.status(400).json({ error: "Missing prompt or modifications" });
        
        console.log("[Routes AI] Generating Implementation Blueprint...");
        if (!process.env.GEMINI_API_KEY) {
             return res.status(500).json({ error: "API Key missing" });
        }
        const { GoogleGenerativeAI } = require("@google/generative-ai");
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

        const systemPrompt = `You are an AI Software Architect. Your job is to create or update an Implementation Blueprint.
Return ONLY valid JSON in the exact following format, without any markdown formatting or code blocks:
{
  "pages": ["Page 1", "Page 2"],
  "backend": ["Backend Feature 1", "Backend Feature 2"],
  "integrations": ["Integration 1"]
}
Keep the items concise (1-3 words each).`;

        let userMessage = `Generate an implementation blueprint for this app idea: "${prompt}"`;
        if (modifications && currentBlueprint) {
            userMessage = `Current Blueprint:
${JSON.stringify(currentBlueprint, null, 2)}

User Modifications Requested: "${modifications}"

Please update the blueprint based on these modifications and return the full updated JSON.`;
        }

        const result = await model.generateContent([
            { text: systemPrompt },
            { text: userMessage }
        ]);

        const text = result.response.text();
        const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const json = JSON.parse(cleanedText);
        
        res.json(json);
    } catch (err) {
        console.error("[Routes AI] Blueprint API failed:", err);
        res.status(500).json({ error: "Failed to generate blueprint" });
    }
});

module.exports = router;

