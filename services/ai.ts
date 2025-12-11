import { sendMessageToGemini } from './gemini';
import { sendMessageToOpenAI } from './openai';
import { AI_MODELS } from '../constants';

export type ModelProvider = 'google' | 'openai';

export const sendMessageToAI = async (
  provider: ModelProvider,
  message: string,
  history: { role: string; parts: { text: string }[] }[],
  onToolCall: (name: string, args: any) => Promise<any>
) => {
  if (provider === 'openai') {
    // Pass the configured OpenRouter model ID explicitly (Now NEXO_V2)
    return await sendMessageToOpenAI(message, history, AI_MODELS.NEXO_V2.id);
  } else {
    // Default to Gemini (Google) - Now NEXO_FLEX
    return await sendMessageToGemini(message, history, onToolCall);
  }
};