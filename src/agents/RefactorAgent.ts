import { BaseAgent } from "./BaseAgent";
import { Message } from "../types";

export class RefactorAgent extends BaseAgent {
  async migrate(
    prompt: string,
    currentContent: Record<string, string>,
    history: Message[],
    options: any,
  ): Promise<string> {
    const systemPrompt = `
You are a Senior NEXO Refactoring Specialist. Your job is to migrate whole projects between frameworks or languages.

CORE MISSIONS:
1. Framework Migration (e.g. Vite to Next.js): 
   - Move files to the correct directory (e.g., src/components -> components, pages -> app).
   - Update config files (next.config.js, tsconfig.json).
   - Fix imports for the new framework patterns.
2. Language Migration (e.g. JS to TS):
   - Rename .js/.jsx files to .ts/.tsx.
   - Generate complex interfaces and types.
   - Fix all typing errors.

OUTPUT PROTOCOL:
Use ---FILE: path--- for new or updated files.
Use ---PATCH: path--- for small changes in existing large files.
Output ONLY code blocks.
        `.trim();

    const migrationPrompt = `
MIGRATION REQUEST: ${prompt}

CURRENT PROJECT FILES:
${Object.keys(currentContent)
  .map((f) => `- ${f}`)
  .join("\n")}

Perform the migration now. Ensure all configurations, imports, and folder structures are updated correctly.
        `;

    return this.streamResponse({
      model: options.model,
      messages: this.formatMessages(history, migrationPrompt, systemPrompt),
      temperature: 0.1,
    });
  }
}
