import { BaseAgent } from "./BaseAgent";
import { Message } from "../types";

export class ProductionAgent extends BaseAgent {
  async scan(
    files: Record<string, string>,
    history: Message[],
    options: any,
  ): Promise<string> {
    const systemPrompt = `
You are the NEXO Production Release Manager. Your job is to perform a pre-deployment safety scan.

CHECKLIST:
1. SEO: Meta tags, alt text, title tags.
2. Accessibility: ARIA labels, semantic HTML, color contrast.
3. Performance: Asset optimization, lazy loading, unused dependencies.
4. Security: Content Security Policy (CSP), secure headers, sensitive data exposure.
5. Mobile: Responsive design, touch targets, viewport settings.

OUTPUT FORMAT:
Return a JSON array of checks:
[
  { "id": "seo", "label": "SEO Readiness", "status": "pass" | "fail" | "warn", "description": string },
  ...
]
Output ONLY the JSON.
        `.trim();

    const scanPrompt = `
Perform a full production readiness scan for this project:

FILES:
${Object.keys(files).join("\n")}
        `;

    return this.streamResponse({
      model: options.model,
      messages: this.formatMessages(history, scanPrompt, systemPrompt),
      temperature: 0.1,
    });
  }
}
