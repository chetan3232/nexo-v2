import { BaseAgent } from "./BaseAgent";
import { Message, AIModelOptions } from "../types";

export class DebugAgent extends BaseAgent {
  async fix(
    errorMsg: string,
    history: Message[],
    options: AIModelOptions,
    onChunk?: (text: string) => void,
  ): Promise<string> {
    const errorPrompt = `
THE FOLLOWING RUNTIME ERROR OCCURRED:
\`\`\`
${errorMsg}
\`\`\`

PROJECT CONTEXT:
- Mode: ${options.projectMode}
- Tech Stack: ${options.techStack}
- Language: ${options.selectedLanguage}

YOUR TASK:
1. Analyze the stack trace and identify the exact line/dependency causing the failure.
2. If it is a dependency conflict (e.g. peer deps), suggest an NPM fix (downgrade/upgrade).
3. Output the fix in NEXO protocol (---FILE: path--- or ---PATCH: path---).
4. MANDATORY: Include an AI_CONFIDENCE_SCORE (0-100) at the end.
   - If confidence is < 70%, explain WHY you are unsure.

Example Output:
...code fixes...
AI_CONFIDENCE_SCORE: 85
`.trim();

    const messages = this.formatMessages(
      history,
      errorPrompt,
      "You are a NEXO Senior Systems Debugger. You excel at solving complex dependency conflicts and runtime crashes.",
    );

    const payload = {
      model: options.model,
      messages,
      agentRole: "debugger",
      temperature: 0.1,
      projectMode: options.projectMode,
      techStack: options.techStack,
    };

    return this.streamResponse(payload, onChunk);
  }
}
