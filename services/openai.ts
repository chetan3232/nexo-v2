import { AI_MODELS } from "../constants";

export const sendMessageToOpenAI = async (
  message: string,
  history: { role: string; parts: { text: string }[] }[],
  modelId: string = AI_MODELS.NEXO_FLEX.id
) => {
  // This service now routes to Google Gemini directly via the /api/chat backend.
  // OpenRouter has been removed from this project.
  console.warn("[sendMessageToOpenAI] This function is deprecated. Use sendMessageToGemini instead.");
  return `Error: OpenAI/OpenRouter integration has been removed. Please use the Gemini provider.`;
};