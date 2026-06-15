import { BaseAgent } from './BaseAgent';

export class SecurityAgent extends BaseAgent {
  name = 'Security Agent';
  systemPrompt = `You are the NEXO V2 Security Agent. Your job is to analyze the generated files list for security risks (e.g. hardcoded secrets, input sanitization issues, lack of HTTPS, weak dependency validation).
Provide a short text summary outlining any vulnerability scans.`;

  async performScan(files: Record<string, string>): Promise<string> {
    const fileKeys = Object.keys(files).join(', ');
    return this.execute(`Identify security issues or vulnerability scans for the files: [${fileKeys}]`);
  }
}
export default SecurityAgent;
