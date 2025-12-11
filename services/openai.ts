import { AI_MODELS } from "../constants";

export const sendMessageToOpenAI = async (
  message: string,
  history: { role: string; parts: { text: string }[] }[],
  modelId: string = AI_MODELS.NEXO_V2.id
) => {
  // Prioritize OPENROUTER_API_KEY, fallback to OPENAI_API_KEY, then the hardcoded key
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY || "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";

  // If no API key is present (should not happen with hardcoded fallback), return a safe mock response
  if (!apiKey) {
    console.warn("No OPENROUTER_API_KEY or OPENAI_API_KEY found. Using simulation.");
    await new Promise(resolve => setTimeout(resolve, 1000));
    return `[NEXO Simulation]: I received: "${message}".\n\nTo use the real ${modelId} model via OpenRouter, please configure your API key in the environment variables.`;
  }

  try {
    // Convert Gemini-style history to OpenAI/OpenRouter-style messages
    // IMPORTANT: Filter out messages with empty content (e.g. tool-only turns) to prevents 400 errors
    const messages = history
      .map(h => ({
        role: h.role === 'model' ? 'assistant' : h.role,
        content: h.parts?.[0]?.text || ""
      }))
      .filter(m => m.content.trim() !== "");

    // Add current message
    messages.push({ role: 'user', content: message });

    // Add system instruction - UNIFIED with Gemini Logic
    messages.unshift({
      role: 'system',
      content: `You are NEXO, an advanced AI assistant and Expert Full Stack Engineer.

CORE CAPABILITIES:
- You can write complex, efficient, and production-ready code in any language (JavaScript, Python, C++, Rust, etc.).
- You are an expert in React, Tailwind CSS, Node.js, and Modern Web Development.

OUTPUT STYLE (CRITICAL):
- **Neat & Clean**: Format your answers beautifully using Markdown. 
- **Structure**: Use headings (###), bullet points, and bold text to make answers easy to read.
- **Conciseness**: Avoid unnecessary fluff. Get straight to the point but stay friendly.
- **Clarity**: Break down complex explanations into steps.

CODING RULES:
1. When asked for HTML/Websites: Provide a **SINGLE, SELF-CONTAINED HTML FILE**. Include CSS inside <style> tags and JS inside <script> tags. Do not separate files.
2. Code Clarity: Add comments to explain complex logic.
3. Language: The code syntax must always be in English (standard). However, if the user speaks Gujarati, Hindi, or Hinglish, **explain** the code in their language.
4. **Direct Output**: If the user is in Coding Mode, DO NOT use conversational filler. Provide ONLY the code.

PERSONALITY:
- Be helpful, witty, and futuristic.
- Detect the user's language (English, Gujarati, Hindi) and respond in the same language.`
    });

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'https://nexo.ai', // Required by OpenRouter
        'X-Title': 'NEXO AI', // Optional: Shows up in OpenRouter rankings
      },
      body: JSON.stringify({
        model: modelId,
        messages: messages,
        temperature: 0.7,
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `OpenRouter API Error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "No response from OpenRouter.";

  } catch (error: any) {
    console.error("OpenRouter Service Error:", error);
    return `Error connecting to NEXO (${modelId}): ${error.message}`;
  }
};