import { invokeAI } from "../services/geminiService";
import { AIModelOptions } from "../types";

export class DevOpsAgent {
  async configureEnvironment(
    prd: string,
    techStack: string,
    options: AIModelOptions,
  ): Promise<string> {
    const systemPrompt = `
You are a Cloud DevOps Specialist. Your task is to ensure the project is production-ready.
Generate:
- CI/CD pipelines (GitHub Actions)
- Environment variables (.env.example)
- Docker configurations
- Cloud platform settings (Vercel/Netlify)

Output Format: ---FILE: path/to/file.ext--- blocks.
`;
    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: `PRD: ${prd}\nTech Stack: ${techStack}` },
    ];
    return await invokeAI(messages, options.model, 0.3, 1);
  }
}
