import { Message } from "../types";

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
    const API_URL = "/api/chat";

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...payload,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      throw new Error(`Nexo API returned ${response.status}: ${errText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response stream available");

    const decoder = new TextDecoder();
    let fullText = "";
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === "data: [DONE]") continue;
        if (!trimmed.startsWith("data: ")) continue;

        try {
          const json = JSON.parse(trimmed.slice(6));
          const delta = json.choices?.[0]?.delta;
          const content = delta?.content || "";

          if (content) {
            fullText += content;
            if (onChunk) onChunk(fullText);
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
    }

    return fullText;
  }

  protected formatMessages(
    history: Message[],
    newText: string,
    systemPrompt?: string,
  ) {
    const messages = history.map((msg) => ({
      role: msg.role === "user" ? "user" : "assistant",
      content: msg.text || "",
    }));

    if (systemPrompt) {
      messages.unshift({ role: "system", content: systemPrompt } as any);
    }

    messages.push({ role: "user", content: newText });

    return messages.slice(-12); // Keep last 12 messages for context
  }
}
