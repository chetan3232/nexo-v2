import { BaseAgent } from "./BaseAgent";
import { Message, AIModelOptions } from "../types";
import { CollaborationBus } from "./CollaborationBus";

export class BackendAgent extends BaseAgent {
  async generateLogic(
    prompt: string,
    history: Message[],
    options: AIModelOptions,
  ): Promise<string> {
    const systemPrompt = `
You are a Senior Full-Stack NEXO Engineer. You specialize in building backend services that run inside a browser (WebContainer).

CAPABILITIES:
1. Framework: Express.js
2. Database: SQLite with Prisma ORM
3. API: RESTful or GraphQL

TASKS:
- Generate 'server.ts' or 'app.ts' with Express logic.
- Define 'prisma/schema.prisma' for SQLite.
- Create API routes that perform CRUD operations using the Prisma Client.
- Ensure all backend files follow the NEXO protocol (---FILE: path---).

COLLABORATION: Respond to any requests from the Frontend agent. If you see 'FRONTEND_REQUEST: ...', implement it. 
`.trim();

    const collaborationContext = CollaborationBus.getInstance()
      .getRequestsFor("backend")
      .map((r) => `REQUEST FROM ${r.from}: ${r.content}`)
      .join("\n");

    const finalPrompt = collaborationContext
      ? `${prompt}\n\nPENDING REQUESTS:\n${collaborationContext}`
      : prompt;

    const payload = {
      model: options.model,
      messages: this.formatMessages(history, finalPrompt, systemPrompt),
      agentRole: "backend",
      temperature: 0.5,
      top_p: 1,
    };

    return this.streamResponse(payload);
  }
}
