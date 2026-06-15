import { BaseAgent } from './BaseAgent';

export class PlannerAgent extends BaseAgent {
  name = 'Planner Agent';
  systemPrompt = `You are the NEXO V2 Planner Agent. Your job is to take a user prompt and generate a structured checklist of development tasks required to build the requested application.
You must output a JSON array of tasks. Do not include any explanation or markdown formatting in your response, return ONLY the raw JSON string.

JSON Schema:
[
  {
    "id": "unique-task-id",
    "label": "Brief human readable task description",
    "agent": "Planner" | "PM" | "Designer" | "Frontend" | "Backend" | "DevOps" | "QA" | "Security"
  }
]`;

  async generateChecklist(prompt: string): Promise<any[]> {
    const raw = await this.execute(`Generate a step-by-step checklist of 5-8 items for: "${prompt}"`);
    try {
      // Clean potential code fences
      const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleaned);
    } catch (e) {
      console.error("Failed to parse checklist JSON, using default checklist", e, raw);
      return [
        { id: 'devops-init', label: 'Setup project workspace configuration and scripts', agent: 'DevOps' },
        { id: 'design-tokens', label: 'Define typography and custom theme color palettes', agent: 'Designer' },
        { id: 'prd-gen', label: 'Draft product requirements document (prd.md)', agent: 'PM' },
        { id: 'fe-views', label: 'Generate layout frames and core screen interfaces', agent: 'Frontend' },
        { id: 'be-mock', label: 'Build backend handlers and databases', agent: 'Backend' },
        { id: 'qa-audit', label: 'Run performance, SEO and layout score scans', agent: 'QA' }
      ];
    }
  }
}
export default PlannerAgent;
