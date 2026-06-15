
import { Message, WebsiteContent } from '../types';

export const OPENROUTER_MODELS = [
  { id: 'nvidia/nemotron-3-super-120b-a12b:free', name: 'NVIDIA Nemotron-3 Super 120B (Free)' },
  { id: 'google/gemma-4-31b-it:free', name: 'Gemma 4 31B (OpenRouter)' }
];

const extractCodeFromText = (text: string): { website?: WebsiteContent, cleanText: string } => {
  const files: Record<string, string> = {};
  let cleanText = text;
  
  const blockRegex = /```(\w+)(?:\s+filename="([^"]+)"|\s+\[([^\]]+)\])?\s*([\s\S]*?)\s*```/gi;
  let match;
  let hasContent = false;

  while ((match = blockRegex.exec(text)) !== null) {
    const lang = match[1].toLowerCase();
    const metadataName = match[2] || match[3];
    let code = match[4].trim();
    
    let filename = metadataName;
    if (!filename) {
      const firstLineComment = code.split('\n')[0].match(/(?:\/\/|#|\/\*)\s*filename:\s*([\w./-]+)/i);
      if (firstLineComment) {
        filename = firstLineComment[1];
      } else {
        if (lang === 'html') filename = 'index.html';
        else if (lang === 'css') filename = 'styles.css';
        else if (['javascript', 'js'].includes(lang)) filename = 'script.js';
        else if (['typescript', 'tsx'].includes(lang)) filename = 'App.tsx';
        else filename = `file_${Object.keys(files).length}.${lang}`;
      }
    }

    files[filename] = code;
    hasContent = true;
    cleanText = cleanText.replace(match[0], '');
  }

  if (!hasContent) return { cleanText };

  const mainFile = files['index.html'] ? 'index.html' : (files['App.tsx'] ? 'App.tsx' : Object.keys(files)[0]);

  return {
    website: { files, mainFile },
    cleanText: cleanText.trim() || "I've generated the project files for you."
  };
};

export const generateOpenRouterResponse = async (
  history: Message[],
  newMessage: string,
  model: string = 'nvidia/nemotron-3-super-120b-a12b:free',
  onStateChange?: (state: any) => void,
  systemInstruction: string = ""
): Promise<{ text: string; websiteContent?: WebsiteContent; isError?: boolean }> => {
  
  const apiKey = process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY !== 'undefined'
    ? process.env.OPENROUTER_API_KEY
    : '';
  
  if (!apiKey) {
    return { text: "OpenRouter API Key is missing. Please add it to your environment variables.", isError: true };
  }

  const messages = [
    { role: 'system', content: systemInstruction },
    ...history.map(msg => ({
      role: (msg.role === 'model' || msg.role === 'assistant') ? 'assistant' : 'user',
      content: msg.text
    })),
    { role: 'user', content: newMessage }
  ];

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": window.location.origin,
        "X-Title": "Nexo v2",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "model": model,
        "messages": messages,
        "temperature": 0.2,
      })
    });

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message || "Unknown OpenRouter error");
    }

    const responseText = data.choices[0].message.content || "";
    const parsed = extractCodeFromText(responseText);
    
    if (parsed.website && onStateChange) onStateChange("BUILDING");

    return {
      text: parsed.cleanText,
      websiteContent: parsed.website
    };
  } catch (error: any) {
    console.error("OpenRouter Generation Error:", error);
    return { text: `API Error: ${error.message}`, isError: true };
  }
};
