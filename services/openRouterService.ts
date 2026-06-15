
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
  const isReact = Object.keys(files).some(f => f.endsWith('.tsx') || f.endsWith('.ts'));

  return {
    website: { 
      files, 
      mainFile,
      template: isReact ? 'react' : 'web'
    },
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
  try {
    const messages = [
      ...history.map(msg => ({
        role: (msg.role === 'model' || msg.role === 'assistant') ? 'model' : 'user',
        content: msg.text
      })),
      { role: 'user', content: newMessage }
    ];

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messages,
        model,
        systemInstruction
      })
    });

    const data = await response.json();
    if (data.status === 'error') {
      throw new Error(data.text);
    }

    const responseText = data.text || "";
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
