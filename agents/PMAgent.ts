import { BaseAgent } from './BaseAgent';

export class PMAgent extends BaseAgent {
  name = 'PM Agent';
  systemPrompt = `You are the NEXO V2 PM Agent. Your goal is to write a comprehensive 'prd.md' file that documents the product scope, core requirements, user journey flow, and target audience based on the user's prompt.
Your output must be a valid markdown string starting with '# Product Requirement Document'. Do not output anything else.`;

  async generatePRD(prompt: string): Promise<string> {
    return this.execute(`Create a complete PRD file content for the app: "${prompt}"`);
  }
}
export default PMAgent;
