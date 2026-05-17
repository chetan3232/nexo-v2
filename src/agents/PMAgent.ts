import { invokeAI } from "../services/geminiService";
import { Message, AIModelOptions } from "../types";

export class PMAgent {
  async generatePRD(
    prompt: string,
    history: Message[],
    options: AIModelOptions,
  ): Promise<string> {
    const systemPrompt = `
You are the NEXO Product Manager. Your job is to convert a raw user idea into a professional PRD (Product Requirement Document).
MODE: ${options.projectMode.toUpperCase()}
LANGUAGE: ${options.selectedLanguage}
Focus on:
- Core Problem & Solution
- User Personas
- Functional Requirements (The "What")
- Tech Architecture for ${options.projectMode} using ${options.selectedLanguage}
- User Stories
- Success Metrics

Output Format: Markdown with clear headings.
`;
    const messages = history.map((m) => ({ role: m.role, content: m.text }));
    messages.push({ role: "system", content: systemPrompt } as any);
    messages.push({ role: "user", content: prompt });

    return await invokeAI(messages, options.model, 0.1, options.topP, false);
  }

  async generateTaskGraph(prd: string): Promise<any[]> {
    // Logic to convert PRD into executable tasks for other agents
    return [
      {
        id: "design",
        agent: "DesignerAgent",
        description: "Define design system",
      },
      {
        id: "frontend",
        agent: "FrontendAgent",
        description: "Build UI components",
      },
      {
        id: "backend",
        agent: "BackendAgent",
        description: "Setup API endpoints",
      },
    ];
  }
}
