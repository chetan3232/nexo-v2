import { invokeAI } from "../services/geminiService";
import { Message, AIModelOptions } from "../types";

export class DesignerAgent {
  async generateDesignTokens(
    prompt: string,
    options: AIModelOptions,
  ): Promise<string> {
    const systemPrompt = `
You are the NEXO UI/UX Architect. Your job is to define the visual language of the project.
Output a JSON design system:
- Colors (Primary, Secondary, Accent, Neutral)
- Typography (Heading & Body Fonts)
- Spacing & Radius
- Component Style Guidelines (Glassmorphism, Flat, Neumorphism, etc.)

Output Format: JSON code block.
`;
    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt },
    ];
    return await invokeAI(messages, options.model, 0.1, 1, false);
  }

  async reviewUI(code: string): Promise<string> {
    // Designer reviews the generated frontend code for aesthetic violations
    return "Review results...";
  }
}
