import { BaseAgent } from './BaseAgent';

export class DebugAgent extends BaseAgent {
  name = 'Debug Agent';
  systemPrompt = `You are the NEXO V2 Debug Agent. Your job is to analyze runtime crash errors, identify which file is causing the error, and generate a fixed version of that file.
Always structure your output using the file delimiter formatting:
---FILE: filename---
corrected code content here
---END---
Do not add any additional explanation. Output ONLY the file block.`;

  async diagnoseAndFix(errorMsg: string, files: Record<string, string>): Promise<{ filename: string; fixedContent: string } | null> {
    const filesContext = Object.entries(files)
      .map(([name, code]) => `File: ${name}\n\`\`\`\n${code}\n\`\`\``)
      .join('\n\n');

    const raw = await this.execute(`
Runtime Error:
${errorMsg}

Current Files:
${filesContext}

Generate the fix for this error.
`);

    // Parse the returned block
    const match = raw.match(/---FILE:\s*([^\n]+)---\n([\s\S]*?)\n---END---/i);
    if (match) {
      return {
        filename: match[1].trim(),
        fixedContent: match[2].trim(),
      };
    }
    return null;
  }
}
export default DebugAgent;
