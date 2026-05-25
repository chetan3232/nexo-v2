const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Load Gemini API Key from environment variable
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const SYSTEM_PROMPT = `You are NEXO v0, the world's most advanced AI Frontend Architect, inspired by the precision and aesthetic excellence of v0.dev and Claude 3.5. You do not just write code; you engineer breathtaking, production-ready digital experiences.

### 🎨 DESIGN PHILOSOPHY (v0 STANDARDS)
1. **Minimalist Premium**: Use a sophisticated palette—neutral grays (stone/slate), deep blacks, and pure whites, accented by a single high-contrast brand color (e.g., Indigo-600 or Emerald-500).
2. **Typography Excellence**: Mandate "Inter" or "Outfit" via Google Fonts. Use fluid typography with generous tracking for headers and tight leading for body text.
3. **Micro-Interactions**: Implement smooth transitions, hover-triggered transforms, and scroll-reveals using Intersection Observer or Framer Motion (if React).
4. **The "Glass" Effect**: Utilize mesh gradients, backdrop-blur (glassmorphism), and subtle 1px borders to create depth.

### 🏗️ ARCHITECTURAL MANDATES
1. **Modular Thinking**: Even in Vanilla projects, organize code logically. Use ES Modules where possible.
2. **The Nexo Protocol**: Every file MUST be wrapped in:
   ---FILE: path/to/filename.ext---
   [CODE]
   ---END FILE---
3. **No Markdown Wrappers**: Never use backticks inside the protocol blocks.
4. **Framework Flexibility**:
   - For **Vanilla**: Generate index.html, style.css, script.js.
   - For **React**: Generate App.tsx, components/Header.tsx, components/Hero.tsx, etc. Always include a clean index.html and tailwind.config.js if applicable.

### 🚀 ASSET INTEGRITY
- Use high-resolution Unsplash IDs. NEVER use placeholders.
- Use Lucide-React or FontAwesome for iconography.

Build with the soul of an architect and the precision of a compiler.`;

const logUsage = (tokens = 0) => {
    try {
        const logPath = path.join(__dirname, '../data/usage.json');
        let usage = { calls: [], totalTokens: 0 };
        
        if (fs.existsSync(logPath)) {
            usage = JSON.parse(fs.readFileSync(logPath));
        }
        
        usage.calls.push({
            timestamp: new Date().toISOString(),
            tokens: tokens
        });
        usage.totalTokens += tokens;
        
        // Keep only last 1000 calls to prevent file bloat
        if (usage.calls.length > 1000) usage.calls.shift();
        
        fs.writeFileSync(logPath, JSON.stringify(usage, null, 2));

        // Markdown Logging
        const mdPath = path.join(__dirname, '../data/USAGE.md');
        const timestamp = new Date().toLocaleString();
        const mdEntry = `| ${timestamp} | ${tokens.toLocaleString()} | ${usage.totalTokens.toLocaleString()} |\n`;
        
        if (!fs.existsSync(mdPath)) {
            const header = "# 📊 NEXO AI Usage Log\n\n| Timestamp | Tokens Used | Cumulative Tokens |\n| :--- | :--- | :--- |\n";
            fs.writeFileSync(mdPath, header + mdEntry);
        } else {
            fs.appendFileSync(mdPath, mdEntry);
        }
    } catch (e) {
        console.error('Logging failed:', e);
    }
};

// axios removed, using native Node fetch

router.post('/chat', async (req, res) => {
    try {
        const { messages, model = 'gemini-2.5-flash', temperature = 1.0, top_p = 1.0, projectMode = 'frontend', techStack = 'Vanilla', stream = true, enableThinking = true } = req.body;

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ error: 'Messages array is required' });
        }

        const apiKey = process.env.NVIDIA_API_KEY || process.env.GROQ_API_KEY || process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return res.status(401).json({ error: 'API Key (NVIDIA_API_KEY, GROQ_API_KEY, or GEMINI_API_KEY) is missing.' });
        }

        const reqTemperature = 1.0;
        const reqTopP = 1.0;
        const maxTokens = 16384;
        const chatTemplateKwargs = { "enable_thinking": enableThinking, "clear_thinking": false };

        let currentSystemPrompt = SYSTEM_PROMPT;

        // Dynamic Prompt Injection based on Mode & Tech Stack
        if (projectMode === 'fullstack') {
            currentSystemPrompt = currentSystemPrompt.replace(
                /FORBIDDEN TECHNOLOGIES:[\s\S]*?- To simulate backend workflows/,
                `ALLOWED TECHNOLOGIES:\n- Modern Server-side languages (Node.js, Python, Go, etc.)\n- Databases (SQL, NoSQL)\n- Full Stack Frameworks (Next.js, Remix, etc.)`
            );
            currentSystemPrompt = currentSystemPrompt.replace(
                /You MUST generate EXACTLY THREE \(3\) separated files\. NEVER deviate from this structure:[\s\S]*?3\. script\.js/,
                `You are a Full-Stack Architect. You MUST generate the COMPLETE architecture (Frontend + Backend). No file limit applies, but use the Nexo Protocol markers.`
            );
            currentSystemPrompt = currentSystemPrompt.replace(
                /You are strictly limited to FRONTEND TECHNOLOGIES:/,
                `You are empowered with FULL STACK CAPABILITIES:`
            );
        }

        if (techStack !== 'Vanilla') {
            currentSystemPrompt += `\n\n### TECHNOLOGY STACK MANDATE\nYou MUST build this project using the following specific stack: **${techStack}**. 
            Adjust your file structure accordingly. If this is a framework project (like React/Next.js), generate all necessary configuration files (package.json, tailwind.config.js, etc.) within the ---FILE--- markers.`;
            
            // Relax the 3-file constraint for non-vanilla stacks
            currentSystemPrompt = currentSystemPrompt.replace(
                /You MUST generate EXACTLY THREE \(3\) separated files\. NEVER deviate from this structure:[\s\S]*?3\. script\.js/,
                `You should generate all files required for a professional **${techStack}** project. Use the Nexo Protocol markers for every file.`
            );
        } else {
            currentSystemPrompt += `\n\n### TECHNOLOGY STACK MANDATE\nYou are building a Vanilla (HTML/CSS/JS) project. 
            You MUST generate EXACTLY THREE (3) separated files: index.html, style.css, and script.js.
            CRITICAL: Ensure your index.html contains a root element like <div id="app"></div> and your Javascript accurately targets it!`;
        }

        const messagesPayload = [
            { role: 'system', content: currentSystemPrompt },
            ...messages.map(m => ({
                role: m.role === 'model' || m.role === 'assistant' ? 'assistant' : 'user',
                content: m.content || m.text || ''
            }))
        ];

        let invokeUrl = null;
        let finalMessages = [...messagesPayload];
        
        // Route: NVIDIA NIM API (for MiniMax-M2.7 and other NVIDIA-hosted models)
        const isNvidiaModel = model.startsWith('nvidia/') || model === 'minimaxai/minimax-m2.7';

        // Route: Groq API
        const isGroqModel = !isNvidiaModel && (model.startsWith('groq/') || model.includes('llama') || model.includes('mixtral'));
        
        // Route: Google Gemini API (official direct)
        const isGoogleModel = !isNvidiaModel && !isGroqModel && (model.startsWith('google/') || model.startsWith('gemini-')) && process.env.GEMINI_API_KEY;

        if (isNvidiaModel) {
            invokeUrl = 'https://integrate.api.nvidia.com/v1/chat/completions';
            console.log(`[AI Route] Routing to NVIDIA NIM API with model: ${model}`);
        } else if (isGroqModel && process.env.GROQ_API_KEY) {
            invokeUrl = "https://api.groq.com/openai/v1/chat/completions";
            const actualModel = model.startsWith('groq/') ? model.replace('groq/', '') : model;
            
            // Compress context to fit within Groq's extremely low 12,000 TPM limit on free tier
            if (finalMessages.length > 2) {
                const systemMessage = finalMessages[0];
                const history = finalMessages.slice(-2);
                finalMessages = [systemMessage, ...history];
                console.log(`[AI Direct Route] Compressed Groq context. Kept system prompt + last 2 messages. Count: ${finalMessages.length}`);
            }
        } else if (isGoogleModel) {
            invokeUrl = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
            console.log(`[AI Direct Route] Routing to Google Gemini API with model: ${model}`);
        } else {
            return res.status(400).json({ error: `Unsupported model "${model}". Use a gemini-, google/, groq/, or nvidia/ model.` });
        }

        const payload = {
            model: isGroqModel 
                ? (model.startsWith('groq/') ? model.replace('groq/', '') : model) 
                : isNvidiaModel 
                    ? 'minimaxai/minimax-m2.7' 
                    : isGoogleModel 
                        ? model.replace('google/', '') 
                        : model,
            messages: finalMessages,
            max_tokens: isNvidiaModel ? 8192 : maxTokens,
            temperature: isNvidiaModel ? 1 : reqTemperature,
            top_p: isNvidiaModel ? 0.95 : reqTopP,
            stream: isNvidiaModel ? false : stream,  // NVIDIA doesn't support streaming for this model
            ...(!isGroqModel && !isNvidiaModel && !isGoogleModel ? { chat_template_kwargs: chatTemplateKwargs } : {}),
            ...(stream && !isGroqModel && !isNvidiaModel && !isGoogleModel ? { stream_options: { include_usage: true } } : {})
        };

        let headers = {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
        };

        if (isNvidiaModel && process.env.NVIDIA_API_KEY) {
            headers = {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.NVIDIA_API_KEY}`
            };
            console.log(`[AI Route] Calling NVIDIA NIM API with model: ${payload.model}`);
        } else if (isGroqModel && process.env.GROQ_API_KEY) {
            headers = {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
            };
            console.log(`[AI Direct Route] Calling official Groq API directly with model: ${payload.model}`);
        } else if (isGoogleModel && process.env.GEMINI_API_KEY) {
            headers = {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.GEMINI_API_KEY}`
            };
            console.log(`[AI Direct Route] Calling official Google Gemini API directly with model: ${payload.model}`);
        }
        
        const apiResponse = await fetch(invokeUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload)
        });

        if (!apiResponse.ok) {
            let errorText = await apiResponse.text();
            throw new Error(`API Error: ${apiResponse.status} - ${errorText}`);
        }

        if (stream) {
            // ReadableStream consumption in Node (fetch API)
            const reader = apiResponse.body.getReader();
            const decoder = new TextDecoder();
            let fullStreamText = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                const chunk = decoder.decode(value, { stream: true });
                res.write(value);

                // Try to extract usage from stream chunks
                const lines = chunk.split('\n');
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const dataStr = line.slice(6).trim();
                        if (dataStr === '[DONE]') continue;
                        try {
                            const json = JSON.parse(dataStr);
                            if (json.usage) {
                                logUsage(json.usage.total_tokens);
                            }
                        } catch (e) {}
                    }
                }
            }
            res.end();
        } else {
            const data = await apiResponse.json();
            if (data.usage) {
                logUsage(data.usage.total_tokens);
            } else {
                logUsage(0); // Log the call even if tokens unknown
            }
            res.status(200).json(data);
        }

    } catch (error) {
        console.error('AI Chat Error:', error.message);

        // Return a proper error chunk or JSON if headers aren't sent
        if (!res.headersSent) {
            return res.status(500).json({
                error: error.message || 'Failed to get AI response'
            });
        } else {
            res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
            res.end();
        }
    }
});

module.exports = router;
