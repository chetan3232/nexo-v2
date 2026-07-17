import { Message } from "../types";
import { AIRequestManager, RequestPriority } from "../services/aiRequestManager";

export interface AgentResponse {
  fullText: string;
  reasoning?: string;
}

export abstract class BaseAgent {
  protected endpoint = "/api/chat";

  protected async streamResponse(
    payload: any,
    onChunk?: (text: string) => void,
  ): Promise<string> {
    const priority = (payload.priority || "NORMAL") as RequestPriority;
    return AIRequestManager.getInstance().request(payload.messages, {
      model: payload.model,
      temperature: payload.temperature,
      topP: payload.top_p,
      enableThinking: payload.enableThinking,
      priority,
      onChunk,
    });
  }

  protected formatMessages(
    history: Message[],
    newText: string,
    systemPrompt?: string,
  ) {
    const messages = history.map((msg) => ({
      role: msg.role === "user" ? "user" : "assistant",
      content: msg.content || msg.text || "",
    }));

    if (systemPrompt) {
      messages.unshift({ role: "system", content: systemPrompt } as any);
    }

    messages.push({ role: "user", content: newText });

    return messages.slice(-12); // Keep last 12 messages for context
  }
}
