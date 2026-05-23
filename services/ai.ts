import { sendMessageToGemini } from './gemini';

export type ModelProvider = 'google';

export const sendMessageToAI = async (
  provider: ModelProvider,
  message: string,
  history: { role: string; parts: { text: string }[] }[],
  onToolCall: (name: string, args: any) => Promise<any>
) => {
  // Only Google Gemini is supported. OpenRouter has been removed.
  return await sendMessageToGemini(message, history, onToolCall);
};
