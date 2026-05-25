import { BaseAgent } from "./BaseAgent";
import { Message } from "../types";
import { CollaborationBus } from "./CollaborationBus";

export class FrontendAgent extends BaseAgent {
  async generateUI(
    prompt: string,
    history: Message[],
    options: {
      model: string;
      projectMode: string;
      techStack: string;
      selectedLanguage: string;
      temperature?: number;
      topP?: number;
    },
    designSystem?: string,
    onChunk?: (text: string) => void,
  ): Promise<string> {
    const designContext = designSystem
      ? `DESIGN SYSTEM TOKENS:\n${designSystem}`
      : "Generate a modern, clean UI from scratch.";

    const systemPrompt = `You are a Senior UI/UX Architect and Software Engineer.
Your task is to build a complete, high-quality application based on the project plan.
MODE: ${options.projectMode.toUpperCase()}
LANGUAGE: ${options.selectedLanguage}
${designContext}

CRITICAL RULES & GUIDELINES:
1. **MODULAR STRUCTURE**: ALWAYS structure applications modularly. Create multiple separate files under src/components/, src/pages/, src/hooks/, or src/styles/ rather than putting everything in a single HTML or JS/TSX file. Establish clean imports and exports.
2. **DO EXACTLY WHAT IS ASKED - NOTHING MORE, NOTHING LESS**
   - Don't add features not requested
   - Don't improve things not mentioned
3. **USE STANDARD TAILWIND CLASSES ONLY**:
   - ✅ CORRECT: bg-white, text-black, bg-blue-500, bg-gray-100, text-gray-900
   - ❌ WRONG: bg-background, text-foreground, bg-primary, bg-muted, text-secondary
   - Use ONLY classes from the official Tailwind CSS documentation.
3. **STYLING STRICTNESS**:
   - NEVER use inline styles with style={{ }} in JSX
   - NEVER use <style jsx> tags or any CSS-in-JS solutions
   - ALWAYS use standard Tailwind CSS utility classes.
4. **FILE COMPLETION**:
   - **NEVER TRUNCATE FILES** - Always return COMPLETE files with ALL content
   - **NO ELLIPSIS (...)** - Include every single line of code, no skipping
   - Files MUST be complete and runnable.
5. If MODE is 'FULLSTACK', generate BOTH frontend (React/Tailwind) and backend (Node.js/Express) code.
6. If MODE is 'FRONTEND', focus ONLY on a highly interactive UI with HTML, CSS, and JS (or ${options.selectedLanguage}). Use ${options.selectedLanguage} as the primary programming language for all logic.

7. **OUTPUT FORMAT**:
For small updates to existing files, use the PATCH format:
---PATCH: filename.ext---
<<<< SEARCH
[exact lines to replace]
==== REPLACE
[new lines]
>>>>
---END PATCH---

For new files or large rewrites, use the FILE format:
---FILE: filename.ext---
[full content]
---END FILE---

8. Output ONLY code blocks.
9. COLLABORATION: You can request services from other agents. If you need a specific API endpoint, state it clearly: 'BACKEND_REQUEST: Create /movies endpoint for fetching list'.`;

    const collaborationContext = CollaborationBus.getInstance()
      .getRequestsFor("frontend")
      .map((r) => `REQUEST FROM ${r.from}: ${r.content}`)
      .join("\n");

    const finalPrompt = collaborationContext
      ? `${prompt}\n\nPENDING REQUESTS:\n${collaborationContext}`
      : prompt;

    const messages = this.formatMessages(history, finalPrompt, systemPrompt);

    const payload = {
      model: options.model,
      messages,
      agentRole: "coder",
      temperature: options.temperature || 1.0,
      top_p: options.topP || 1.0,
      projectMode: options.projectMode,
      techStack: options.techStack,
    };

    return this.streamResponse(payload, onChunk);
  }
}
