import { Message } from "../types";
import { AIRequestManager, RequestPriority } from "./aiRequestManager";

/**
 * Low-level AI invocation routed via the centralized AI Request Manager.
 */
export const invokeAI = async (
  messages: any[],
  model: string = "z-ai/glm4.7",
  temperature: number = 0.7,
  topP: number = 1,
  enableThinking: boolean = true,
  priority: RequestPriority = "NORMAL",
  signal?: AbortSignal,
): Promise<string> => {
  return AIRequestManager.getInstance().request(messages, {
    model,
    temperature,
    topP,
    enableThinking,
    priority,
    signal,
  });
};
