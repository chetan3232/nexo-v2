import { BaseAgent } from "./BaseAgent";
import { Message } from "../types";

export class QAAgent extends BaseAgent {
  async runTests(prompt: string, code: string, options: any): Promise<string> {
    const systemPrompt = `
You are the NEXO QA Agent. Your job is to analyze the provided code and write automated tests.
Generate unit tests and integration tests using Jest or Vitest.
Return the tests in ---FILE: path--- format.
        `.trim();

    return this.streamResponse({
      model: options.model,
      messages: this.formatMessages(
        [],
        `Analyze this code and write tests for it:\n\n${code}`,
        systemPrompt,
      ),
      temperature: 0.3,
    });
  }
}
