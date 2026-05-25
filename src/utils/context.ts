import { Message } from "../types";
import { invokeAI } from "../services/geminiService";

export class ContextManager {
  private static instance: ContextManager;
  private summary: string = "";

  public static getInstance() {
    if (!ContextManager.instance) {
      ContextManager.instance = new ContextManager();
    }
    return ContextManager.instance;
  }

  async compress(history: Message[], model: string): Promise<Message[]> {
    // If history is too long (e.g. > 10 messages), summarize the older ones
    if (history.length <= 10) return history;

    const toSummarize = history.slice(0, history.length - 5);
    const recent = history.slice(history.length - 5);

    const summaryPrompt = `
        Summarize the following chat history between a user and an AI coding assistant.
        Focus on:
        - The project goal
        - Technical decisions made
        - Features already implemented
        - Errors fixed
        
        Keep it concise.
        `;

    const messages = toSummarize.map((m) => ({
      role: m.role,
      content: m.content || m.text,
    }));
    messages.push({ role: "system", content: summaryPrompt } as any);

    const newSummary = await invokeAI(messages, model, 0.3, 1);

    this.summary = `Previous Chat Summary:\n${newSummary}`;

    return [
      { role: "system", text: this.summary, timestamp: Date.now() },
      ...recent,
    ];
  }

  getSummary() {
    return this.summary;
  }
}
