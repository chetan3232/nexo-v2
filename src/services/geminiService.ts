import { Message } from "../types";

/**
 * Low-level AI invocation via the Nexo backend (Google Gemini).
 */
export const invokeAI = async (
  messages: any[],
  model: string = "z-ai/glm4.7",
  temperature: number = 0.7,
  topP: number = 1,
  enableThinking: boolean = true,
): Promise<string> => {
  const API_URL = "/api/chat";
  const customApiKey = localStorage.getItem("nexo_custom_api_key") || "";

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: messages.map((m) => ({
        role:
          m.role === "model" || m.role === "assistant" ? "assistant" : "user",
        content: m.content || m.text || "",
      })),
      temperature,
      top_p: topP,
      stream: false,
      enableThinking,
      customApiKey,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Nexo API Error: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
};
