import { WebsiteContent } from '../types';

export const extractCodeFromText = (text: string): { website?: WebsiteContent, cleanText: string } => {
  const files: Record<string, string> = {};
  let cleanText = text;
  let hasContent = false;

  // 1. Try to extract files matching the ---FILE: filename--- structure
  const customRegex = /---FILE:\s*([^\n]+)---\n([\s\S]*?)\n---END---/gi;
  let customMatch;
  while ((customMatch = customRegex.exec(text)) !== null) {
    const filename = customMatch[1].trim();
    const code = customMatch[2].trim();
    files[filename] = code;
    hasContent = true;
    cleanText = cleanText.replace(customMatch[0], '');
  }

  // 2. Try to extract files matching standard markdown code blocks: ```lang metadata\ncode\n```
  if (!hasContent) {
    const blockRegex = /```(\w+)(?:\s+filename="([^"]+)"|\s+\[([^\]]+)\])?\s*([\s\S]*?)\s*```/gi;
    let match;
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
  }

  if (!hasContent) return { cleanText };

  // Heuristic for template and entry point
  const mainFile = files['index.html'] ? 'index.html' : (files['App.tsx'] ? 'App.tsx' : Object.keys(files)[0]);
  const isReact = Object.keys(files).some(f => f.endsWith('.tsx') || f.endsWith('.ts'));

  return {
    website: {
      files,
      mainFile,
      template: isReact ? 'react' : 'web',
    },
    cleanText: cleanText.trim() || "I've compiled the workspace files."
  };
};
