import { BaseAgent } from "./BaseAgent";
import { Message } from "../types";
import { useGenerationWorkflowStore } from "../stores/generationWorkflowStore";
import { DesignLockService } from "../services/designLockService";

export class QAAgent extends BaseAgent {
  async runTests(prompt: string, code: string, options: any): Promise<string> {
    const systemPrompt = `
You are the NEXO QA Agent. Your job is to analyze the provided code and write automated tests.
Generate unit tests and integration tests using Jest or Vitest.
Return the tests in ---FILE: path--- format.
        `.trim();

    const snapshot = useGenerationWorkflowStore.getState().selectedDesignSnapshot;
    const finalSystemPrompt = DesignLockService.getInstance().injectDesignLockPrompt(systemPrompt, snapshot);

    return this.streamResponse({
      model: options.model,
      messages: this.formatMessages(
        [],
        `Analyze this code and write tests for it:\n\n${code}`,
        finalSystemPrompt,
      ),
      temperature: 0.3,
      priority: "CRITICAL",
    });
  }
}
