
// Use the official Google GenAI SDK for Gemini models
import { GoogleGenAI } from "@google/genai";
import { Message, WebsiteContent } from '../types';

// Exported AVAILABLE_MODELS to resolve import error in ChatInterface.tsx
export const AVAILABLE_MODELS = [
  { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro (Complex Reasoning & Coding)' },
  { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash (Fast & Balanced)' }
];

export const DEFAULT_SYSTEM_INSTRUCTION = `You are Nexo v2, an elite AI web developer.

**CORE DIRECTIVES:**
1. **Adaptive Tech Stack**:
   - DEFAULT: Use high-quality HTML5, CSS3 (Tailwind), and Vanilla JavaScript.
   - ON REQUEST: If the user mentions "React", "TypeScript", or "TSX", switch to a modular React (18+) component structure.
2. **Multi-File Output**:
   - You can generate multiple files. Always specify the filename in the code block header or as a comment on the first line.
   - Format: \`\`\`tsx filename="components/Header.tsx"
3. **Design Standard**: Use "OpenLovable" aesthetics—glassmorphism, soft shadows, rounded-3xl corners, and Inter/Geist typography.

**OUTPUT FORMATTING:**
- Always provide a full, working set of files.
- If using React, ensure there is an 'App.tsx' which acts as the entry point.
- If using Native, ensure there is an 'index.html'.`;

/**
 * Parses code blocks from AI response text and identifies the project structure.
 */
const extractCodeFromText = (text: string): { website?: WebsiteContent, cleanText: string } => {
  const files: Record<string, string> = {};
  let cleanText = text;
  
  // Pattern to match code blocks with optional filename metadata
  const blockRegex = /```(\w+)(?:\s+filename="([^"]+)"|\s+\[([^\]]+)\])?\s*([\s\S]*?)\s*```/gi;
  let match;
  let hasContent = false;

  while ((match = blockRegex.exec(text)) !== null) {
    const lang = match[1].toLowerCase();
    const metadataName = match[2] || match[3];
    let code = match[4].trim();
    
    // Heuristic for filename if not provided in header
    let filename = metadataName;
    if (!filename) {
      const firstLineComment = code.split('\n')[0].match(/(?:\/\/|#|\/\*)\s*filename:\s*([\w./-]+)/i);
      if (firstLineComment) {
        filename = firstLineComment[1];
      } else {
        // Default naming based on language
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

  // Determine main entry file
  const mainFile = files['index.html'] ? 'index.html' : (files['App.tsx'] ? 'App.tsx' : Object.keys(files)[0]);

  return {
    website: { files, mainFile },
    cleanText: cleanText.trim() || "I've generated the project files for you."
  };
};

/**
 * Generates a response using the Gemini API via @google/genai SDK.
 */
export const generateResponse = async (
  history: Message[],
  newMessage: string,
  model: string = 'gemini-3-pro-preview',
  onStateChange?: (state: any) => void,
  systemInstruction: string = DEFAULT_SYSTEM_INSTRUCTION
): Promise<{ text: string; websiteContent?: WebsiteContent; isError?: boolean }> => {
  
  // Always initialize GoogleGenAI with the environment variable API_KEY directly
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Map history to the content format required by the SDK (alternating user/model roles)
  const contents = history.map(msg => ({
    role: (msg.role === 'model' || msg.role === 'assistant') ? 'model' : 'user',
    parts: [{ text: msg.text }]
  }));
  contents.push({ role: 'user', parts: [{ text: newMessage }] });

  try {
    // Calling the Gemini API for content generation as specified in guidelines
    const response = await ai.models.generateContent({
      model: model,
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.2,
      },
    });

    // Access the text property directly (not a method) from the response
    const responseText = response.text || "";
    const parsed = extractCodeFromText(responseText);
    
    // Signal the BUILDING state if code blocks were found in the output
    if (parsed.website && onStateChange) onStateChange("BUILDING");

    return {
      text: parsed.cleanText,
      websiteContent: parsed.website
    };
  } catch (error: any) {
    console.error("Gemini Generation Error:", error);
    return { text: `API Error: ${error.message}`, isError: true };
  }
};
