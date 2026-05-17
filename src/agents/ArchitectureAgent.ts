import { BaseAgent } from "./BaseAgent";
import { Message } from "../types";

export interface HealthMetric {
  label: string;
  status: "good" | "warning" | "error";
  description: string;
}

export interface ArchitectureReport {
  score: number;
  metrics: HealthMetric[];
}

export class ArchitectureAgent extends BaseAgent {
  async analyze(
    files: Record<string, string>,
    history: Message[],
    options: any,
  ): Promise<string> {
    const systemPrompt = `
You are the NEXO Senior Architecture Auditor. Your job is to scan the project files and provide a technical health report.

CRITERIA:
1. Component Structure: Is it modular and reusable?
2. State Management: Is there excessive prop drilling?
3. Logic Duplication: Are there repeated patterns (e.g. auth, fetch)?
4. Performance: Estimated bundle size and render efficiency.

OUTPUT FORMAT:
Return a JSON block containing:
{
  "score": number (0-100),
  "metrics": [
    { "label": string, "status": "good" | "warning" | "error", "description": string }
  ]
}
Output ONLY the JSON.
        `.trim();

    const analysisPrompt = `
Analyze the following project structure and code quality:

FILES:
${Object.keys(files).join("\n")}

Perform a deep audit.
        `;

    return this.streamResponse({
      model: options.model,
      messages: this.formatMessages(history, analysisPrompt, systemPrompt),
      temperature: 0.1,
    });
  }
}
