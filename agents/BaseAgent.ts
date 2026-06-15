import { useAgentStore } from '../stores/agentStore';
import { generateOpenRouterResponse } from '../services/openRouterService';
import { Message } from '../types';

export abstract class BaseAgent {
  abstract name: string;
  abstract systemPrompt: string;

  async execute(prompt: string, history: Message[] = []): Promise<string> {
    const selectedModel = useAgentStore.getState().selectedModel;
    
    // Convert base agent prompts
    const response = await generateOpenRouterResponse(
      history,
      prompt,
      selectedModel,
      undefined,
      this.systemPrompt
    );

    if (response.isError) {
      throw new Error(response.text);
    }

    return response.text;
  }
}
