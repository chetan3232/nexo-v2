import { BaseAgent } from "./BaseAgent";
import { Message } from "../types";
import { ANIMATION_PROMPT_INJECTION } from "../utils/animations";

export class AnimationAgent extends BaseAgent {
  async animate(
    prompt: string,
    history: Message[],
    options: any,
  ): Promise<string> {
    const systemPrompt = `
You are a Senior Motion Designer at NEXO. Your expertise is Apple-level animations using Framer Motion.

RULES:
${ANIMATION_PROMPT_INJECTION}

MISSION:
Identify components in the user's project and wrap them with motion.div.
Add entry/exit animations, hover scales, and spring transitions.
Ensure the UI feels "alive" and extremely premium.

Output the full files with integrated animations using ---FILE: path--- blocks.
        `.trim();

    return this.streamResponse({
      model: options.model,
      messages: this.formatMessages(history, prompt, systemPrompt),
      temperature: 0.7,
    });
  }
}
