const OpenAI = require("openai");
const { z } = require("zod");
const { RateLimiterMemory } = require("rate-limiter-flexible");
const fs = require("fs");
const path = require("path");
const allowanceManager = require("./allowanceManager");

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
  systemPrompt: z.string().optional(),
  enabledTools: z.array(z.string()).optional(),
  customApiKey: z.string().optional(),
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

const buildSystemPrompt = (basePrompt, enabledTools, projectMode, techStack) => {
  let prompt = basePrompt || SYSTEM_PROMPT;

  if (projectMode === "fullstack") {
    prompt += `\n\n### FULL STACK ARCHITECTURE MANDATE
You are a Full-Stack Architect. You are empowered with FULL STACK CAPABILITIES. You MUST generate the COMPLETE architecture (Frontend + Backend). No file limit applies, but use the Nexo Protocol markers.
ALLOWED TECHNOLOGIES:
- Modern Server-side languages (Node.js, Python, Go, etc.)
- Databases (SQL, NoSQL)
- Full Stack Frameworks (Next.js, Remix, etc.)`;
  }

  if (techStack !== "Vanilla") {
    prompt += `\n\n### TECHNOLOGY STACK MANDATE
You MUST build this project using the following specific stack: **${techStack}**. 
Adjust your file structure accordingly. If this is a framework project (like React/Next.js), generate all necessary configuration files (package.json, tailwind.config.js, etc.) within the ---FILE--- markers.
You should generate all files required for a professional **${techStack}** project. Use the Nexo Protocol markers for every file.`;
  } else {
    prompt += `\n\n### TECHNOLOGY STACK MANDATE
You are building a Vanilla (HTML/CSS/JS) project. 
You MUST generate EXACTLY THREE (3) separated files: index.html, style.css, and script.js.
CRITICAL: Ensure your index.html contains a root element like <div id="app"></div> and your Javascript accurately targets it!`;
  }

  // Filter tools list dynamically
  if (enabledTools && Array.isArray(enabledTools)) {
    let capabilities = `\n\n### ⚡ AUTONOMOUS CAPABILITIES\n\nYou have these virtual tools available. Narrate when using them:`;
    if (enabledTools.includes("read_file")) {
      capabilities += `\n- readFile(path) — reading existing code`;
    }
    if (enabledTools.includes("write_file")) {
      capabilities += `\n- writeFile(path, content) — creating/updating files\n- createComponent(name) — building a UI component\n- installPackage(name) — adding a dependency`;
    }
    if (enabledTools.includes("deploy")) {
      capabilities += `\n- deploy() — deploying live on production (Vercel)`;
    }
    if (enabledTools.includes("preview")) {
      capabilities += `\n- runBuild() — verifying the project builds and runs in preview sandbox`;
    }
    if (enabledTools.includes("search")) {
      capabilities += `\n- search(query) — scraping external web content/documentation via Firecrawl`;
    }
    prompt += capabilities;
  }

  // Append Nexo file wrap protocol if not already explicitly present
  if (!prompt.includes("---FILE:")) {
    prompt += `\n\n### 📁 NEXO PROTOCOL — FILE FORMAT (MANDATORY)
Every single file MUST use this exact format. Never use markdown code blocks inside:
---FILE: path/to/filename.ext---
[COMPLETE FILE CONTENTS HERE]
---END FILE---
Rules:
- NEVER use backticks inside ---FILE--- markers
- ALWAYS write COMPLETE file contents (never truncate)
- Include ALL necessary files for the project to run
- Path must be relative (no leading slash)`;
  }

  return prompt;
};

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

const logUsage = (model, inputTokens = 0, outputTokens = 0, durationMs = 0, userId = "anonymous") => {
  try {
    const logPath = path.join(__dirname, "../data/usage.json");
    let usage = { calls: [], totalTokens: 0, totalInputTokens: 0, totalOutputTokens: 0, totalCost: 0 };

    if (fs.existsSync(logPath)) {
      try {
        usage = JSON.parse(fs.readFileSync(logPath));
      } catch (e) {
        // Fallback
      }
    }

    if (usage.totalInputTokens === undefined) usage.totalInputTokens = 0;
    if (usage.totalOutputTokens === undefined) usage.totalOutputTokens = 0;
    if (usage.totalCost === undefined) usage.totalCost = 0;

    const rates = {
      "gemini-2.5-flash": { input: 0.075, output: 0.30 },
      "gemini-2.5-pro": { input: 1.25, output: 5.00 },
      "gemini-2.0-flash": { input: 0.075, output: 0.30 },
      "qwen/qwen3-coder-480b-a35b-instruct": { input: 0.00, output: 0.00 },
      "stepfun-ai/step-3.5-flash": { input: 0.00, output: 0.00 },
      "groq/llama-3.3-70b-versatile": { input: 0.59, output: 0.79 }
    };

    const isNvidiaModel = model.includes("nvidia") || model.includes("stepfun") || model.includes("qwen/qwen3-coder-480b-a35b-instruct");
    const rate = isNvidiaModel ? { input: 0.00, output: 0.00 } : (rates[Object.keys(rates).find(k => model.includes(k)) || "default"] || { input: 0.10, output: 0.30 });

    const cost = ((inputTokens * rate.input) + (outputTokens * rate.output)) / 1000000;
    const tokens = inputTokens + outputTokens;
    const speed = durationMs > 0 ? Math.round((outputTokens / durationMs) * 1000) : 0;

    // Deduct cost from User Allowance balance
    allowanceManager.deductAllowance(userId, cost);

    usage.calls.push({
      timestamp: new Date().toISOString(),
      model: model,
      inputTokens,
      outputTokens,
      tokens: tokens,
      cost: Number(cost.toFixed(6)),
      speed,
      durationMs
    });

    usage.totalTokens += tokens;
    usage.totalInputTokens += inputTokens;
    usage.totalOutputTokens += outputTokens;
    usage.totalCost = Number((usage.totalCost + cost).toFixed(6));

    if (usage.calls.length > 1000) usage.calls.shift();

    fs.writeFileSync(logPath, JSON.stringify(usage, null, 2));

    // Update 1-minute stats
    minuteStats.totalCalls++;
    minuteStats.modelCalls[model] = (minuteStats.modelCalls[model] || 0) + 1;
    minuteStats.modelTokens[model] = (minuteStats.modelTokens[model] || 0) + tokens;
    minuteStats.totalTokens += tokens;

    console.log(`\n\x1b[32m[AI Success]\x1b[0m Model: "${model}" | Tokens: ${tokens.toLocaleString()} (In: ${inputTokens}, Out: ${outputTokens}) | Cost: $${cost.toFixed(6)} | Speed: ${speed} t/s | Time: ${new Date().toLocaleTimeString()}\n`);

    // Markdown Logging
    const mdPath = path.join(__dirname, "../data/USAGE.md");
    const timestamp = new Date().toLocaleString();
    const mdEntry = `| ${timestamp} | ${model} | ${inputTokens.toLocaleString()} | ${outputTokens.toLocaleString()} | $${cost.toFixed(6)} | ${speed} t/s | ${usage.totalTokens.toLocaleString()} |\n`;

    if (!fs.existsSync(mdPath)) {
      const header = "# 📊 NEXO AI Usage Log\n\n| Timestamp | Model | Input Tokens | Output Tokens | Cost ($) | Speed (t/s) | Cumulative Tokens |\n| :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n";
      fs.writeFileSync(mdPath, header + mdEntry);
    } else {
      fs.appendFileSync(mdPath, mdEntry);
    }
  } catch (e) {
    console.error("Logging failed:", e);
  }
};

const callWithRetry = async (fn, maxRetries = 3, initialDelay = 1000) => {
  let delay = initialDelay;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const status = err.status || err.statusCode;
      const msg = (err.message || "").toLowerCase();
      const isTransient = !status || 
                          [429, 500, 502, 503, 504].includes(status) || 
                          msg.includes("timeout") || 
                          msg.includes("network") || 
                          msg.includes("rate limit") || 
                          msg.includes("too many requests") || 
                          msg.includes("429") || 
                          msg.includes("503");
      
      if (!isTransient || attempt === maxRetries) {
        throw err;
      }
      
      console.warn(`[AI Gateway] Attempt ${attempt} failed with transient error (${err.message}). Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
};

// 3. Provider setup helper
const getClient = (provider, customApiKey) => {
  const apiKey = customApiKey || (
    provider === "nvidia" ? process.env.NVIDIA_API_KEY :
    provider === "groq" ? process.env.GROQ_API_KEY :
    provider === "openai" ? (process.env.OPENAI_API_KEY || customApiKey) :
    provider === "openrouter" ? (process.env.OPENROUTER_API_KEY || customApiKey || process.env.GEMINI_API_KEY) :
    process.env.GEMINI_API_KEY
  );

  if (provider === "nvidia") {
    return new OpenAI({
      apiKey: apiKey,
      baseURL: "https://integrate.api.nvidia.com/v1",
    });
  } else if (provider === "groq") {
    return new OpenAI({
      apiKey: apiKey,
      baseURL: "https://api.groq.com/openai/v1",
    });
  } else if (provider === "gemini") {
    return new OpenAI({
      apiKey: apiKey,
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai",
    });
  } else if (provider === "openai") {
    return new OpenAI({
      apiKey: apiKey,
    });
  } else if (provider === "openrouter") {
    return new OpenAI({
      apiKey: apiKey,
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": "https://nexo.ai",
        "X-Title": "Nexo AI Workspace",
      }
    });
  }
  return null;
};

// Define fallback list based on model requested
const getFallbackChain = (requestedModel) => {
  const isNvidia = requestedModel.startsWith("nvidia/") || requestedModel === "minimaxai/minimax-m2.7" || requestedModel.startsWith("stepfun-ai/") || requestedModel === "qwen/qwen3-coder-480b-a35b-instruct";
  const isGroq = !isNvidia && (requestedModel.startsWith("groq/") || requestedModel.includes("llama") || requestedModel.includes("mixtral"));
  const isOpenAI = requestedModel.startsWith("openai/") || requestedModel.startsWith("gpt-");
  const isAnthropic = requestedModel.startsWith("anthropic/") || requestedModel.startsWith("claude-");
  const isOpenRouter = requestedModel.includes("/");

  let possibleChain = [];

  if (isOpenAI) {
    possibleChain = [
      { provider: "openai", model: requestedModel.replace("openai/", "") },
      { provider: "gemini", model: "gemini-2.5-flash" }
    ];
  } else if (isAnthropic || isOpenRouter) {
    possibleChain = [
      { provider: "openrouter", model: requestedModel },
      { provider: "gemini", model: "gemini-2.5-flash" }
    ];
  } else if (isNvidia) {
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
    if (step.provider === "nvidia" && (process.env.NVIDIA_API_KEY || process.env.GEMINI_API_KEY)) {
      finalChain.push(step);
    } else if (step.provider === "groq" && (process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY)) {
      finalChain.push(step);
    } else if (step.provider === "gemini" && process.env.GEMINI_API_KEY) {
      finalChain.push(step);
    } else if (step.provider === "openai" || step.provider === "openrouter") {
      finalChain.push(step);
    }
  }

  return finalChain.length > 0 ? finalChain : possibleChain;
};

class AIGateway {
  static async streamCompletion({ messages, model, temperature, top_p, projectMode, techStack, systemPrompt, enabledTools, customApiKey, userId }, onChunk) {
    const apiKey = customApiKey || process.env.OPENROUTER_API_KEY || process.env.NVIDIA_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("API Credentials missing on server.");
    }

    const currentSystemPrompt = buildSystemPrompt(systemPrompt, enabledTools, projectMode, techStack);

    const messagesPayload = [
      { role: "system", content: currentSystemPrompt },
      ...messages.map((m) => ({
        role: m.role === "model" || m.role === "assistant" ? "assistant" : "user",
        content: m.content || m.text || "",
      })),
    ];

    const fallbackChain = getFallbackChain(model || "inclusionai/ling-2.6-1t:free");
    let errorLog = [];

    for (let attempt = 0; attempt < fallbackChain.length; attempt++) {
      const { provider, model: targetModel } = fallbackChain[attempt];

      try {
        console.log(`[AI Gateway Stream] Attempt ${attempt + 1}: Routing to ${provider} using "${targetModel}"`);

        const client = getClient(provider, customApiKey);
        if (!client) {
          throw new Error(`Provider ${provider} is not configured.`);
        }

                const maxTokens = provider === "nvidia" ? 8192 : 16384;
        
        const startTime = Date.now();
        const responseStream = await callWithRetry(() => client.chat.completions.create({
          model: targetModel,
          messages: messagesPayload,
          temperature: temperature || 1.0,
          top_p: top_p || 1.0,
          stream: true,
          max_tokens: maxTokens,
        }));

        let fullText = "";
        for await (const chunk of responseStream) {
          const content = chunk.choices?.[0]?.delta?.content || "";
          fullText += content;
          if (onChunk) onChunk(content);
        }
        const durationMs = Date.now() - startTime;

        const promptEst = Math.ceil(JSON.stringify(messagesPayload).length / 4);
        const respEst = Math.ceil(fullText.length / 4);
        logUsage(targetModel, promptEst, respEst, durationMs, userId);

        return fullText;
      } catch (err) {
        console.error(`[AI Gateway Stream] Attempt ${attempt + 1} (${provider}) failed:`, err.message);
        errorLog.push(`${provider} (${targetModel}): ${err.message}`);

        if (attempt === fallbackChain.length - 1) {
          throw new Error(`All attempts failed: ${errorLog.join(", ")}`);
        }
      }
    }
  }

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

    const { messages, model, temperature, top_p, projectMode, techStack, stream, enableThinking, systemPrompt, enabledTools, customApiKey } = parsed.data;

    const apiKey = customApiKey || process.env.OPENROUTER_API_KEY || process.env.NVIDIA_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(401).json({ error: "API Credentials missing on server." });
    }

    const userId = req.headers["x-user-id"] || "anonymous";
    const email = req.headers["x-user-email"] || "";

    const userAllowance = allowanceManager.checkAllowance(userId, email);
    if (userAllowance.balance <= 0) {
      const isAnonymous = !userId || userId === 'anonymous';
      const limitMsg = isAnonymous
        ? "You have exceeded your anonymous free allowance ($0.50). Please sign in to get a $5.00 free allowance."
        : "You have exceeded your free allowance ($5.00). Allowance resets every 2 days.";
      
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
                content: `\n\n❌ **Error:** ${limitMsg}\n\n`,
              },
            },
          ],
        };
        res.write(`data: ${JSON.stringify(errChunk)}\n\n`);
        res.write("data: [DONE]\n\n");
        res.end();
        return;
      } else {
        return res.status(403).json({ error: limitMsg });
      }
    }

    console.log(`\n\x1b[33m[AI Request]\x1b[0m Model: "${model}" | Mode: ${projectMode} | Stack: ${techStack} | Stream: ${stream} | Time: ${new Date().toLocaleTimeString()}`);

    // Prompt engineering - system prompt assembly
    const currentSystemPrompt = buildSystemPrompt(systemPrompt, enabledTools, projectMode, techStack);

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

        const client = getClient(provider, customApiKey);
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

          const startTime = Date.now();
          const responseStream = await callWithRetry(() => client.chat.completions.create({
            model: targetModel,
            messages: messagesPayload,
            temperature: temperature,
            top_p: top_p,
            stream: true,
            max_tokens: maxTokens,
          }));

          let fullText = "";
          for await (const chunk of responseStream) {
            const content = chunk.choices?.[0]?.delta?.content || "";
            fullText += content;
            res.write(`data: ${JSON.stringify(chunk)}\n\n`);
          }
          const durationMs = Date.now() - startTime;

          const promptEst = Math.ceil(JSON.stringify(messagesPayload).length / 4);
          const respEst = Math.ceil(fullText.length / 4);
          logUsage(targetModel, promptEst, respEst, durationMs, userId);

          res.write("data: [DONE]\n\n");
          res.end();
        } else {
          const startTime = Date.now();
          const completion = await callWithRetry(() => client.chat.completions.create({
            model: targetModel,
            messages: messagesPayload,
            temperature: temperature,
            top_p: top_p,
            stream: false,
            max_tokens: maxTokens,
          }));
          const durationMs = Date.now() - startTime;

          const promptEst = Math.ceil(JSON.stringify(messagesPayload).length / 4);
          const text = completion.choices?.[0]?.message?.content || "";
          const respEst = Math.ceil(text.length / 4);
          logUsage(targetModel, promptEst, respEst, durationMs, userId);

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
