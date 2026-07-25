import { invokeAI } from "../services/geminiService";
import { Message, AIModelOptions } from "../types";
import { useGenerationWorkflowStore } from "../stores/generationWorkflowStore";
import { DesignLockService } from "../services/designLockService";

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
    const snapshot = useGenerationWorkflowStore.getState().selectedDesignSnapshot;
    const finalSystemPrompt = DesignLockService.getInstance().injectDesignLockPrompt(systemPrompt, snapshot);

    const messages = [
      { role: "system", content: finalSystemPrompt },
      { role: "user", content: prompt },
    ];
    return await invokeAI(messages, options.model, 0.1, 1, false);
  }

  async reviewUI(code: string): Promise<string> {
    // Designer reviews the generated frontend code for aesthetic violations
    return "Review results...";
  }
}
