const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const { z } = require("zod");
const { RateLimiterMemory } = require("rate-limiter-flexible");
const AIGateway = require("../services/aiGateway");
const { addJob, jobEvents, getJob } = require("../services/queueManager");
const NexoAnalyst = require("../services/nexoAnalyst");
const NexoOrchestrator = require("../services/nexoOrchestrator");



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
                const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

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

// 5. Intent and Design Exploration API (2 genuinely separate parallel calls)
router.post("/explore", async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!prompt) return res.status(400).json({ error: "Missing prompt" });
        
        console.log("[Routes AI] Starting Intent & Design Exploration (parallel) for:", prompt);
        if (!process.env.GEMINI_API_KEY) {
             return res.status(500).json({ error: "API Key missing" });
        }
        const { GoogleGenerativeAI } = require("@google/generative-ai");
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

        const intentPrompt = `You are an AI Product Architect. Given a user prompt, extract the app intent.
Return ONLY valid JSON, no markdown:
{
  "appType": "String (e.g. SaaS Dashboard, E-commerce, Portfolio, Landing Page)",
  "targetUsers": "String",
  "platform": "Web | Mobile | Both",
  "features": ["Feature 1", "Feature 2", "Feature 3", "Feature 4"]
}
User Prompt: ${prompt}`;

        const conceptAPrompt = `You are a UI/UX Design System Architect. Generate ONE design concept for this app: "${prompt}".
Style Direction: PROFESSIONAL, CLEAN, MINIMAL. Think: clean lines, subtle colors, elegant spacing, modern SaaS.
Return ONLY valid JSON, no markdown:
{
  "id": "A",
  "title": "[Descriptive Name] — e.g. Clean Professional",
  "description": "2-sentence description of the aesthetic and mood",
  "mood": "professional | minimal | corporate | elegant",
  "componentStyle": "flat | glassmorphism | neumorphic",
  "darkMode": false,
  "gradients": false,
  "styles": {
    "primaryColor": "#hex",
    "accentColor": "#hex",
    "backgroundColor": "#hex",
    "cardColor": "#hex",
    "textColor": "#hex",
    "borderRadius": "8px | 12px | 16px",
    "typography": "Inter | Outfit | Space Grotesk | Playfair Display",
    "animation": "Minimal | Normal | Premium"
  }
}`;

        const conceptBPrompt = `You are a UI/UX Design System Architect. Generate ONE design concept for this app: "${prompt}".
Style Direction: BOLD, VIBRANT, EXPRESSIVE. Think: strong colors, personality, creative layouts, startup energy. Make it GENUINELY different from a minimal/professional style.
Return ONLY valid JSON, no markdown:
{
  "id": "B",
  "title": "[Descriptive Name] — e.g. Bold Creative",
  "description": "2-sentence description of the aesthetic and mood",
  "mood": "bold | playful | creative | vibrant | energetic",
  "componentStyle": "flat | glassmorphism | neumorphic",
  "darkMode": true,
  "gradients": true,
  "styles": {
    "primaryColor": "#hex",
    "accentColor": "#hex",
    "backgroundColor": "#hex",
    "cardColor": "#hex",
    "textColor": "#hex",
    "borderRadius": "16px | 20px | 24px",
    "typography": "Inter | Outfit | Space Grotesk | Playfair Display",
    "animation": "Normal | Premium"
  }
}`;

        const modelA = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const modelB = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const modelIntent = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const [intentResult, conceptAResult, conceptBResult] = await Promise.all([
            modelIntent.generateContent([{ text: intentPrompt }]),
            modelA.generateContent([{ text: conceptAPrompt }]),
            modelB.generateContent([{ text: conceptBPrompt }])
        ]);

        const parseJSON = (text) => {
            const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
            return JSON.parse(cleaned);
        };

        const intent = parseJSON(intentResult.response.text());
        const conceptA = parseJSON(conceptAResult.response.text());
        const conceptB = parseJSON(conceptBResult.response.text());

        res.json({ intent, concepts: [conceptA, conceptB] });
    } catch (err) {
        console.error("[Routes AI] Explore API failed:", err);
        res.status(500).json({ error: "Failed to generate design concepts" });
    }
});

// 5b. NexoStudio Unified Init — fires thinking + design-A + design-B in ONE round trip
router.post("/studio-init", async (req, res) => {
    try {
        const { prompt, mode } = req.body;
        if (!prompt) return res.status(400).json({ error: "Missing prompt" });

        console.log("[Routes AI] NexoStudio studio-init for:", prompt);

        const [exploreResult, analyzeResult] = await Promise.all([
            // Design concepts (3 parallel sub-calls inside explore)
            fetch(`http://localhost:5000/api/ai/explore`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt })
            }).then(r => r.json()),

            // Thinking / project plan
            NexoAnalyst.analyze(prompt, mode || 'fullstack', '', null, [], null)
        ]);

        res.json({
            explore: exploreResult,
            analysis: analyzeResult
        });
    } catch (err) {
        console.error("[Routes AI] studio-init failed:", err);
        res.status(500).json({ error: "Failed to initialize NexoStudio" });
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
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

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

// 7. Requirement Analysis & Planning API (Nexo Analyst)
router.post("/analyze", async (req, res) => {
    try {
        const { user_prompt, mode, chat_uid, existing_plan, conversation_history } = req.body;
        if (!user_prompt) {
            return res.status(400).json({ error: "Missing user_prompt parameter" });
        }

        const customApiKey = req.body.customApiKey || null;

        console.log(`[Routes AI] Running Nexo Analyst for chat_uid: ${chat_uid || 'new'}`);
        const analysis = await NexoAnalyst.analyze(
            user_prompt,
            mode || "fullstack",
            chat_uid || "",
            existing_plan || null,
            conversation_history || [],
            customApiKey
        );

        res.json(analysis);
    } catch (err) {
        console.error("[Routes AI] Nexo Analyst API failed:", err);
        res.status(500).json({ error: err.message || "Failed to analyze requirements" });
    }
});

// 8. Orchestrator Reliability, Routing & Retry API
router.post("/orchestrate", (req, res) => {
    try {
        const { requested_model, mode, stage, attempt_history, payload } = req.body;
        
        if (!requested_model || !stage || !mode) {
            return res.status(400).json({ error: "Missing required parameters (requested_model, mode, stage)" });
        }

        console.log(`[Routes AI] Running Nexo Orchestrator for stage: ${stage}, model: ${requested_model}`);
        const decision = NexoOrchestrator.decide(
            requested_model,
            mode,
            stage,
            attempt_history || [],
            payload || {}
        );

        res.json(decision);
    } catch (err) {
        console.error("[Routes AI] Nexo Orchestrator API failed:", err);
        res.status(500).json({ error: err.message || "Failed to make orchestration decision" });
    }
});

module.exports = router;

