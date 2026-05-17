import { BaseAgent } from "./BaseAgent";

export class SecurityAgent extends BaseAgent {
  async scanVulnerabilities(code: string, options: any): Promise<string> {
    const systemPrompt = `
You are the NEXO Security Agent. Your job is to perform a vulnerability scan on the provided code.
Identify security risks like SQL injection, XSS, insecure dependencies, or leaked secrets.
Provide a detailed report and suggest fixes in ---PATCH: path--- format if possible.
        `.trim();

    return this.streamResponse({
      model: options.model,
      messages: this.formatMessages(
        [],
        `Scan this code for security vulnerabilities:\n\n${code}`,
        systemPrompt,
      ),
      temperature: 0.1,
    });
  }
}
