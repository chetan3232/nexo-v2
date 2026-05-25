const OpenAI = require("openai");
const { z } = require("zod");
const { RateLimiterMemory } = require("rate-limiter-flexible");
const fs = require("fs");
const path = require("path");

// 1. Zod Request validation schema
const chatRequestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.string(),
      content: z.string(),
    })
  ),
  model: z.string().optional().default("inclusionai/ling-2.6-1t:free"),
  temperature: z.number().optional().default(1.0),
  top_p: z.number().optional().default(1.0),
  projectMode: z.string().optional().default("frontend"),
  techStack: z.string().optional().default("Vanilla"),
  stream: z.boolean().optional().default(true),
  enableThinking: z.boolean().optional().default(true),
});

// 2. Rate Limiting setup (Max 200 requests per 15 minutes per IP)
const rateLimiter = new RateLimiterMemory({
  points: 200,
  duration: 15 * 60,
});

const SYSTEM_PROMPT = `You are NEXO AI Workspace Engine — an autonomous AI software engineer and architect.

You are NOT a chatbot. You are an agentic IDE that BUILDS, FIXES, and DEPLOYS software.

### 🧠 CORE BEHAVIOR: NARRATE EVERY ACTION

Before EVERY action, you MUST narrate what you are about to do. Use this exact format:
> 🧠 [What you are doing and why]

Example narrations:
> 🧠 Analyzing requirements to determine the best component structure...
> 🧠 Creating the Navbar component with responsive mobile menu...
> 🧠 Fixing the TypeScript import error in Hero.tsx...
> 🧠 Installing framer-motion for smooth animations...

### 🏗️ MANDATORY WORKFLOW (ALWAYS FOLLOW IN ORDER)

1. **THINK** — Briefly explain the full plan (2-4 sentences max)
2. **NARRATE** — Before each file: state what you're creating and why
3. **CREATE** — Write all files using the Nexo Protocol markers
4. **SUMMARIZE** — After all files: one sentence summary of what was built

### 📁 NEXO PROTOCOL — FILE FORMAT (MANDATORY)

Every single file MUST use this exact format. Never use markdown code blocks inside:

---FILE: path/to/filename.ext---
[COMPLETE FILE CONTENTS HERE]
---END FILE---

Rules:
- NEVER use backticks inside ---FILE--- markers
- ALWAYS write COMPLETE file contents (never truncate)
- Include ALL necessary files for the project to run
- Path must be relative (no leading slash)

### 🎨 DESIGN PHILOSOPHY (v0/Cursor STANDARDS)

1. **Premium Aesthetics**: Use sophisticated color palettes — deep blacks, stone/slate neutrals, with ONE accent color (indigo-600, emerald-500, or violet-600)
2. **Typography**: Always import Inter or Outfit from Google Fonts. Use fluid type scale.
3. **Micro-Interactions**: Hover transforms, focus rings, smooth transitions on all interactive elements
4. **Glassmorphism**: backdrop-blur, semi-transparent cards, 1px borders for depth
5. **Never use placeholder images** — use real Unsplash URLs or CSS gradients

### 🚀 TECHNOLOGY RULES

- For Vanilla: Generate EXACTLY 3 files: index.html, style.css, script.js
- For React/Next.js: Generate App.tsx + all component files + config files
- Always include package.json with correct dependencies if using a framework
- Always use semantic HTML5 elements
- Always make designs fully responsive (mobile + tablet + desktop)

### ⚡ AUTONOMOUS CAPABILITIES

You have these virtual tools available. Narrate when using them:
- readFile(path) — reading existing code
- writeFile(path, content) — creating/updating files  
- createComponent(name) — building a UI component
- installPackage(name) — adding a dependency
- fixError(error) — resolving a bug
- runBuild() — verifying the project builds

### 🎯 SUCCESS CRITERIA

Your output is successful when:
- Every file uses the ---FILE--- markers
- Every action has a narration comment before it
- The generated code is production-ready, not a prototype
- Design is premium, not generic
- All files are complete (zero truncation)

Build with the soul of an architect, the speed of a compiler, and the precision of a senior engineer.`;

// In-memory metrics tracking for the 1-minute recap
let minuteStats = {
  totalCalls: 0,
  modelCalls: {},
  modelTokens: {},
  totalTokens: 0,
};

// Start the 1-minute recap timer
setInterval(() => {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`\n\x1b[36m================== 📊 NEXO AI 1-MINUTE RECAP (Time: ${timestamp}) ==================\x1b[0m`);
  if (minuteStats.totalCalls === 0) {
    console.log(`\x1b[90mNo API calls were made in the last minute.\x1b[0m`);
  } else {
    console.log(`Total API Calls: \x1b[33m${minuteStats.totalCalls}\x1b[0m`);
    console.log(`Total Tokens Used: \x1b[33m${minuteStats.totalTokens.toLocaleString()}\x1b[0m`);
    console.log(`Breakdown by Model:`);
    Object.keys(minuteStats.modelCalls).forEach((model) => {
      const tokens = minuteStats.modelTokens[model];
      console.log(`  - \x1b[35m${model}\x1b[0m | \x1b[32m${tokens.toLocaleString()}\x1b[0m tokens`);
    });
  }
  console.log(`\x1b[36m==========================================================================\x1b[0m\n`);

  // Reset stats for the next 1 minute interval
  minuteStats.totalCalls = 0;
  minuteStats.modelCalls = {};
  minuteStats.modelTokens = {};
  minuteStats.totalTokens = 0;
}, 60 * 1000);

const logUsage = (model, tokens = 0) => {
  try {
    const logPath = path.join(__dirname, "../data/usage.json");
    let usage = { calls: [], totalTokens: 0 };

    if (fs.existsSync(logPath)) {
      usage = JSON.parse(fs.readFileSync(logPath));
    }

    usage.calls.push({
      timestamp: new Date().toISOString(),
      model: model,
      tokens: tokens,
    });
    usage.totalTokens += tokens;

    if (usage.calls.length > 1000) usage.calls.shift();

    fs.writeFileSync(logPath, JSON.stringify(usage, null, 2));

    // Update 1-minute stats
    minuteStats.totalCalls++;
    minuteStats.modelCalls[model] = (minuteStats.modelCalls[model] || 0) + 1;
    minuteStats.modelTokens[model] = (minuteStats.modelTokens[model] || 0) + tokens;
    minuteStats.totalTokens += tokens;

    console.log(`\n\x1b[32m[AI Success]\x1b[0m Model: "${model}" | Tokens: ${tokens.toLocaleString()} | Time: ${new Date().toLocaleTimeString()}\n`);

    // Markdown Logging
    const mdPath = path.join(__dirname, "../data/USAGE.md");
    const timestamp = new Date().toLocaleString();
    const mdEntry = `| ${timestamp} | ${model} | ${tokens.toLocaleString()} | ${usage.totalTokens.toLocaleString()} |\n`;

    if (!fs.existsSync(mdPath)) {
      const header = "# 📊 NEXO AI Usage Log\n\n| Timestamp | Model | Tokens Used | Cumulative Tokens |\n| :--- | :--- | :--- | :--- |\n";
      fs.writeFileSync(mdPath, header + mdEntry);
    } else {
      fs.appendFileSync(mdPath, mdEntry);
    }
  } catch (e) {
    console.error("Logging failed:", e);
  }
};

// 3. Provider setup helper
const getClient = (provider) => {
  if (provider === "nvidia") {
    return new OpenAI({
      apiKey: process.env.NVIDIA_API_KEY,
      baseURL: "https://integrate.api.nvidia.com/v1",
    });
  } else if (provider === "groq") {
    return new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
    });
  } else if (provider === "gemini") {
    return new OpenAI({
      apiKey: process.env.GEMINI_API_KEY,
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai",
    });
  }
  return null;
};

// Define fallback list based on model requested
const getFallbackChain = (requestedModel) => {
  const isNvidia = requestedModel.startsWith("nvidia/") || requestedModel === "minimaxai/minimax-m2.7" || requestedModel.startsWith("stepfun-ai/");
  const isGroq = !isNvidia && (requestedModel.startsWith("groq/") || requestedModel.includes("llama") || requestedModel.includes("mixtral"));

  let possibleChain = [];

  if (isNvidia) {
    const actualModel = requestedModel === "nvidia/minimax-m2.7" || requestedModel === "minimaxai/minimax-m2.7"
      ? "minimaxai/minimax-m2.7"
      : (requestedModel.startsWith("nvidia/") ? requestedModel.replace("nvidia/", "") : requestedModel);

    possibleChain = [
      { provider: "nvidia", model: actualModel },
      { provider: "groq", model: "llama-3.3-70b-versatile" },
      { provider: "gemini", model: "gemini-2.5-flash" },
    ];
  } else if (isGroq) {
    const actualModel = requestedModel.startsWith("groq/") ? requestedModel.replace("groq/", "") : requestedModel;
    possibleChain = [
      { provider: "groq", model: actualModel },
      { provider: "gemini", model: "gemini-2.5-flash" },
      { provider: "nvidia", model: "stepfun-ai/step-3.5-flash" },
    ];
  } else {
    const actualModel = requestedModel.startsWith("google/") ? requestedModel.replace("google/", "") : requestedModel;
    possibleChain = [
      { provider: "gemini", model: actualModel },
      { provider: "groq", model: "llama-3.3-70b-versatile" },
      { provider: "nvidia", model: "stepfun-ai/step-3.5-flash" },
    ];
  }

  // Filter possible steps by environment variable presence
  const finalChain = [];
  for (const step of possibleChain) {
    if (step.provider === "nvidia" && process.env.NVIDIA_API_KEY) {
      finalChain.push(step);
    } else if (step.provider === "groq" && process.env.GROQ_API_KEY) {
      finalChain.push(step);
    } else if (step.provider === "gemini" && process.env.GEMINI_API_KEY) {
      finalChain.push(step);
    }
  }

  return finalChain.length > 0 ? finalChain : possibleChain;
};

class AIGateway {
  static async handleRequest(req, res) {
    const ip = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress;

    // 1. Rate Limiting Check
    try {
      await rateLimiter.consume(ip);
    } catch (rejRes) {
      return res.status(429).json({ error: "Too many requests, please try again later." });
    }

    // 2. Validate Request Schema
    const parsed = chatRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid request payload", details: parsed.error.format() });
    }

    const { messages, model, temperature, top_p, projectMode, techStack, stream, enableThinking } = parsed.data;

    const apiKey = process.env.OPENROUTER_API_KEY || process.env.NVIDIA_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(401).json({ error: "API Credentials missing on server." });
    }

    console.log(`\n\x1b[33m[AI Request]\x1b[0m Model: "${model}" | Mode: ${projectMode} | Stack: ${techStack} | Stream: ${stream} | Time: ${new Date().toLocaleTimeString()}`);

    // Prompt engineering - system prompt assembly
    let currentSystemPrompt = SYSTEM_PROMPT;

    if (projectMode === "fullstack") {
      currentSystemPrompt += `\n\n### FULL STACK ARCHITECTURE MANDATE
You are a Full-Stack Architect. You are empowered with FULL STACK CAPABILITIES. You MUST generate the COMPLETE architecture (Frontend + Backend). No file limit applies, but use the Nexo Protocol markers.
ALLOWED TECHNOLOGIES:
- Modern Server-side languages (Node.js, Python, Go, etc.)
- Databases (SQL, NoSQL)
- Full Stack Frameworks (Next.js, Remix, etc.)`;
    }

    if (techStack !== "Vanilla") {
      currentSystemPrompt += `\n\n### TECHNOLOGY STACK MANDATE
You MUST build this project using the following specific stack: **${techStack}**. 
Adjust your file structure accordingly. If this is a framework project (like React/Next.js), generate all necessary configuration files (package.json, tailwind.config.js, etc.) within the ---FILE--- markers.
You should generate all files required for a professional **${techStack}** project. Use the Nexo Protocol markers for every file.`;
    } else {
      currentSystemPrompt += `\n\n### TECHNOLOGY STACK MANDATE
You are building a Vanilla (HTML/CSS/JS) project. 
You MUST generate EXACTLY THREE (3) separated files: index.html, style.css, and script.js.
CRITICAL: Ensure your index.html contains a root element like <div id="app"></div> and your Javascript accurately targets it!`;
    }

    const messagesPayload = [
      { role: "system", content: currentSystemPrompt },
      ...messages.map((m) => ({
        role: m.role === "model" || m.role === "assistant" ? "assistant" : "user",
        content: m.content || m.text || "",
      })),
    ];

    const fallbackChain = getFallbackChain(model);
    let success = false;
    let errorLog = [];

    // Loop through fallback providers
    for (let attempt = 0; attempt < fallbackChain.length; attempt++) {
      const { provider, model: targetModel } = fallbackChain[attempt];

      try {
        console.log(`[AI Gateway] Attempt ${attempt + 1}: Routing to ${provider} using "${targetModel}"`);

        const client = getClient(provider);
        if (!client) {
          throw new Error(`Provider ${provider} is not configured.`);
        }

        const maxTokens = provider === "nvidia" ? 8192 : 16384;
        const actualStream = provider === "nvidia" && targetModel === "minimaxai/minimax-m2.7" ? false : stream;

        if (actualStream) {
          // Initialize SSE response
          if (!res.headersSent) {
            res.setHeader("Content-Type", "text/event-stream");
            res.setHeader("Cache-Control", "no-cache");
            res.setHeader("Connection", "keep-alive");
          }

          // If we failover, let the client know dynamically
          if (attempt > 0) {
            const failoverNotice = {
              choices: [
                {
                  delta: {
                    content: `\n\n*[AI Engine: Failover routing to ${provider} (${targetModel})...]*\n\n`,
                  },
                },
              ],
            };
            res.write(`data: ${JSON.stringify(failoverNotice)}\n\n`);
          }

          const responseStream = await client.chat.completions.create({
            model: targetModel,
            messages: messagesPayload,
            temperature: temperature,
            top_p: top_p,
            stream: true,
            max_tokens: maxTokens,
          });

          let fullText = "";
          for await (const chunk of responseStream) {
            const content = chunk.choices?.[0]?.delta?.content || "";
            fullText += content;
            res.write(`data: ${JSON.stringify(chunk)}\n\n`);
          }

          const promptEst = Math.ceil(JSON.stringify(messagesPayload).length / 4);
          const respEst = Math.ceil(fullText.length / 4);
          logUsage(targetModel, promptEst + respEst);

          res.write("data: [DONE]\n\n");
          res.end();
        } else {
          // Non-streaming call (e.g. Minimax or direct response)
          const completion = await client.chat.completions.create({
            model: targetModel,
            messages: messagesPayload,
            temperature: temperature,
            top_p: top_p,
            stream: false,
            max_tokens: maxTokens,
          });

          const promptEst = Math.ceil(JSON.stringify(messagesPayload).length / 4);
          const text = completion.choices?.[0]?.message?.content || "";
          const respEst = Math.ceil(text.length / 4);
          logUsage(targetModel, promptEst + respEst);

          if (stream) {
            if (!res.headersSent) {
              res.setHeader("Content-Type", "text/event-stream");
              res.setHeader("Cache-Control", "no-cache");
              res.setHeader("Connection", "keep-alive");
            }
            if (attempt > 0) {
              const failoverNotice = {
                choices: [
                  {
                    delta: {
                      content: `\n\n*[AI Engine: Failover routing to ${provider} (${targetModel})...]*\n\n`,
                    },
                  },
                ],
              };
              res.write(`data: ${JSON.stringify(failoverNotice)}\n\n`);
            }

            const fakeChunk = {
              choices: [
                {
                  delta: { content: text },
                },
              ],
            };
            res.write(`data: ${JSON.stringify(fakeChunk)}\n\n`);
            res.write("data: [DONE]\n\n");
            res.end();
          } else {
            res.status(200).json(completion);
          }
        }

        success = true;
        break; // Stop attempt loop
      } catch (err) {
        console.error(`[AI Gateway] Attempt ${attempt + 1} (${provider}) failed:`, err.message);
        errorLog.push(`${provider} (${targetModel}): ${err.message}`);

        // If it's the last attempt, return failure details
        if (attempt === fallbackChain.length - 1) {
          const friendlyMessage = "The AI is temporarily unavailable. Failover routes exhausted.";
          console.error(`[AI Gateway Error] All attempts failed:`, errorLog);

          if (stream) {
            if (!res.headersSent) {
              res.setHeader("Content-Type", "text/event-stream");
              res.setHeader("Cache-Control", "no-cache");
              res.setHeader("Connection", "keep-alive");
            }
            const errChunk = {
              choices: [
                {
                  delta: {
                    content: `\n\n❌ **Error:** ${friendlyMessage} (Logs: ${errorLog.join(", ")})\n\n`,
                  },
                },
              ],
            };
            res.write(`data: ${JSON.stringify(errChunk)}\n\n`);
            res.end();
          } else {
            res.status(500).json({ error: friendlyMessage, details: errorLog });
          }
        }
      }
    }
  }
}

module.exports = AIGateway;
