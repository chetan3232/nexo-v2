import { BaseAgent } from './BaseAgent';

export class BackendAgent extends BaseAgent {
  name = 'Backend Agent';
  systemPrompt = `You are the NEXO V2 Backend Agent. Your job is to output Express API controller files, mock databases, and router mappings.
Always structure code using the file delimiter formatting:
---FILE: server/routes/api.js---
// code ...
---END---
Do not add any additional explanation. Use modular endpoints and mock json storage.`;

  async generateMockAPI(prompt: string, prd: string): Promise<string> {
    return this.execute(`
PRD specs:
${prd}

Create backend files (Node Express server routes/controllers/datasets) to support: "${prompt}"
`);
  }
}
export default BackendAgent;
