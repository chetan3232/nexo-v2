import { invokeAI } from "../services/geminiService";
import { Message, AIModelOptions } from "../types";

export class PlannerAgent {
  async plan(
    prompt: string,
    history: Message[],
    options: AIModelOptions,
  ): Promise<string> {
    const systemPrompt = `
You are the NEXO Architect. Your job is to create a comprehensive technical plan for the requested application.
You must analyze the user prompt and generate a structured JSON plan inside a code block.

The plan should include:
1. Project Overview: Goal and target users.
2. Tech Stack: Frameworks, styling, state management.
3. Feature Roadmap: List of features grouped by module.
4. File Architecture: A tree structure of the files to be created.
5. Component Breakdown: Details for each main component.
6. Data Model: State structure and API needs.

Output Format:
# PLAN
\`\`\`json
{
  "project_name": "...",
  "stack": "...",
  "architecture": {
    "files": ["..."],
    "components": ["..."]
  },
  "phases": ["..."]
}
\`\`\`
Recommended Template: [React-SaaS | E-commerce | Dashboard | AI-Chat]
`;

    const messages = history.map((m) => ({ role: m.role, content: m.text }));
    messages.push({ role: "system", content: systemPrompt } as any);
    messages.push({ role: "user", content: `User Prompt: ${prompt}` });

    return await invokeAI(
      messages,
      options.model,
      options.temperature,
      options.topP,
    );
  }
}
