export const config = {
    maxDuration: 120,
};

const AGENTS = {
    planner: `You are the NEXO Master Planner, an elite AI Software Architect.
Your task is to analyze the user's request and architect a complete, production-ready application. You must think like a CTO.
Consider scalable file structures, essential dependencies, and modern UI/UX patterns.

You MUST output your response in JSON format within a markdown block. Example:
\`\`\`json
{
  "thought": "Detailed architectural analysis...",
  "dependencies": ["lucide-react", "framer-motion", "clsx", "tailwind-merge"],
  "files": [
    "package.json",
    "src/App.tsx",
    "src/components/Header.tsx",
    "src/lib/utils.ts"
  ]
}
\`\`\`
DO NOT output the actual code. ONLY output the strategic plan, dependencies, and file tree.`,

    coder: `You are NEXO AI, an elite autonomous AI Software Engineer. You do not just write code; you build complete, production-ready applications. 
Your tone is highly professional, decisive, and action-oriented. You prioritize flawless logic, elegant architecture, and stunning visual design.

### ARCHITECTURAL MANDATES (NON-NEGOTIABLE)

1.  **Strict Project Structure**: Follow the Master Planner's file tree precisely. Generate all required configuration files (package.json, vite.config.ts, tailwind.config.js, etc.) if building a modern app.
    
2.  **The Nexo Protocol (Markers)**: You MUST wrap each file's complete content in specific markers for the IDE to parse correctly. This is critical for the Sandpack runtime to execute your code.
    *   ---FILE: filename.ext---
    *   (Complete source code)
    *   ---END FILE---

3.  **No Markdown Encapsulation**: Never use triple backticks (\`\`\`) to wrap the code within the ---FILE--- blocks.

4.  **Flawless Integration**: Ensure all imports are accurate. If building React, ensure components are correctly exported and imported.

### VISUAL PHILOSOPHY
Implement "Modern Premium" aesthetics. Your UI must rival Vercel, Linear, and Stripe.
Use glassmorphism, subtle mesh gradients, fluid typography (Inter/Outfit), sophisticated 8px-based spacing, and micro-animations (framer-motion/CSS transitions).

### ASSET INTEGRITY
BANNED: Placeholders. You MUST use real Unsplash IDs for all images:
*   Technology: 1518770660439-4636190af475
*   Code: 1498050108023-c5249f4df085
*   Corporate: 1472099645785-5658abf4ff4e

### RESPONSE FORMATTING
1. Provide a concise, 1-sentence overview of what you are building.
2. Deliver the complete files using the ---FILE--- markers.
3. Ensure absolute syntactic perfection.`,

    debugger: `You are the NEXO Debugger, an elite system reliability engineer.
You are given a runtime error log and the source code of a broken file. Your ONLY job is to identify the root cause and output the corrected file.

You MUST output ONLY the corrected file wrapped in the Nexo Protocol markers:
---FILE: filename.ext---
(Corrected source code)
---END FILE---

DO NOT provide conversational explanations. DO NOT output multiple files unless specifically asked. Focus purely on resolving the error and ensuring stability.`
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { messages, model = 'inclusionai/ling-2.6-1t:free', temperature = 1.0, top_p = 1.0, projectMode = 'frontend', techStack = 'Vanilla', agentRole = 'coder', stream = true } = req.body;

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ error: 'Messages array is required' });
        }

        const apiKey = process.env.NVIDIA_API_KEY;

        if (!apiKey) {
            return res.status(401).json({ error: 'API Key (NVIDIA_API_KEY) is missing.' });
        }

        const reqTemperature = 1.0;
        const reqTopP = 1.0;
        const maxTokens = 16384;
        const chatTemplateKwargs = { "enable_thinking": true, "clear_thinking": false };

        let currentSystemPrompt = AGENTS[agentRole] || AGENTS.coder;

        // Dynamic Prompt Injection based on Mode & Tech Stack ONLY for 'coder' agent
        if (agentRole === 'coder') {
            if (projectMode === 'fullstack') {
                currentSystemPrompt = currentSystemPrompt.replace(
                    /FORBIDDEN TECHNOLOGIES:[\s\S]*?- To simulate backend workflows/,
                    `ALLOWED TECHNOLOGIES:\n- Modern Server-side languages (Node.js, Python, Go, etc.)\n- Databases (SQL, NoSQL)\n- Full Stack Frameworks (Next.js, Remix, etc.)`
                );
                currentSystemPrompt = currentSystemPrompt.replace(
                    /You MUST generate EXACTLY THREE \(3\) separated files\. NEVER deviate from this structure:/,
                    `You are a Full-Stack Architect. You MUST generate the COMPLETE architecture (Frontend + Backend). No file limit applies, but use the Nexo Protocol markers.`
                );
                currentSystemPrompt = currentSystemPrompt.replace(
                    /You are strictly limited to FRONTEND TECHNOLOGIES:/,
                    `You are empowered with FULL STACK CAPABILITIES:`
                );
            }

            if (techStack !== 'Vanilla') {
                currentSystemPrompt += `\n\n### TECHNOLOGY STACK MANDATE\nYou MUST build this project using the following specific stack: **${techStack}**. 
                Adjust your file structure accordingly. If this is a framework project (like React/Next.js), generate all necessary configuration files (package.json, tailwind.config.js, etc.) within the ---FILE--- markers.
                CRITICAL: Ensure your main HTML file contains the correct root element (e.g. <div id="root"></div>) that your React/Frontend code mounts to!`;
                
                // Relax the 3-file constraint for non-vanilla stacks
                currentSystemPrompt = currentSystemPrompt.replace(
                    /You MUST generate EXACTLY THREE \(3\) separated files\. NEVER deviate from this structure:/,
                    `You should generate all files required for a professional **${techStack}** project. Use the Nexo Protocol markers for every file.`
                );
            } else {
                currentSystemPrompt += `\n\n### TECHNOLOGY STACK MANDATE\nYou are building a Vanilla (HTML/CSS/JS) project. 
                You MUST generate EXACTLY THREE (3) separated files: index.html, style.css, and script.js.
                CRITICAL: Ensure your index.html contains a root element like <div id="app"></div> and your Javascript accurately targets it!`;
            }
        }

        const messagesPayload = [
            { role: 'system', content: currentSystemPrompt },
            ...messages.map(m => ({
                role: m.role === 'model' || m.role === 'assistant' ? 'assistant' : 'user',
                content: m.content || m.text || ''
            }))
        ];

        const invokeUrl = "https://openrouter.ai/api/v1/chat/completions";
        const payload = {
            model: model,
            messages: messagesPayload,
            max_tokens: maxTokens,
            temperature: reqTemperature,
            top_p: reqTopP,
            stream: stream,
            chat_template_kwargs: chatTemplateKwargs
        };

        const headers = {
            "Content-Type": "application/json",
            "Accept": "text/event-stream",
            "Authorization": `Bearer ${apiKey}`,
            "HTTP-Referer": "https://nexo.insforge.site",
            "X-Title": "Nexo AI"
        };
        
        const apiResponse = await fetch(invokeUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload)
        });

        if (!apiResponse.ok) {
            const errorText = await apiResponse.text();
            throw new Error(`API Error: ${apiResponse.status} - ${errorText}`);
        }

        if (payload.stream) {
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');

            const reader = apiResponse.body.getReader();
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                res.write(value);
            }
            res.end();
        } else {
            const data = await apiResponse.json();
            res.status(200).json(data);
        }

    } catch (error) {
        console.error('AI Chat Error:', error.message);
        if (!res.headersSent) {
            return res.status(500).json({ error: error.message || 'Failed to get AI response' });
        } else {
            res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
            res.end();
        }
    }
}
