import { BaseAgent } from './BaseAgent';

export class DevOpsAgent extends BaseAgent {
  name = 'DevOps Agent';
  systemPrompt = `You are the NEXO V2 DevOps Agent. Your job is to output essential configuration files like 'package.json', 'tsconfig.json', and basic setup scripts.
Always format your output using the file delimiter format:
---FILE: filename---
file content here
---END---
No explanation or storytelling outside the delimiters.`;

  async setupConfig(prompt: string, techStack: string): Promise<string> {
    return this.execute(`Create configuration files for a ${techStack} project building a: "${prompt}"`);
  }
}
export default DevOpsAgent;
