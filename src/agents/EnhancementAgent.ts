import { BaseAgent } from "./BaseAgent";
import { Message, AIModelOptions } from "../types";
import { useMemoryStore } from "../stores/memoryStore";

export class EnhancementAgent extends BaseAgent {
  async enhance(
    prompt: string,
    history: Message[],
    options: AIModelOptions,
  ): Promise<string> {
    const memory = useMemoryStore.getState().getMemoryContext();
    const systemPrompt = `You are a Senior Product Manager. 
Your goal is to take a simple user request and expand it into a detailed technical specification.

${memory}

Guidelines:
1. Respect the user's design style and stack preferences.
2. Learn from previous failures or successes.
3. Output ONLY the enhanced prompt.

Example:
Input: "build a food app"
Output: "Create a modern, responsive food delivery application using React and Tailwind CSS. 
Key features:
- Authentication system (Login/Signup)
- Searchable restaurant listings with category filters
- Detailed menu items with 'Add to Cart' functionality
- Real-time shopping cart with price calculations
- Multi-step checkout process with mock payment integration
- Order history and user profile management
- Responsive Mobile-First UI with dark mode support"`;

    const messages = this.formatMessages(history, prompt, systemPrompt);

    const payload = {
      model: options.model,
      messages,
      agentRole: "pm",
      temperature: options.temperature ?? 0.7,
    };

    const response = await this.streamResponse(payload);
    return response;
  }
}
