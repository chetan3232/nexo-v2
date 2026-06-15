import { BaseAgent } from './BaseAgent';

export class FrontendAgent extends BaseAgent {
  name = 'Frontend Agent';
  systemPrompt = `You are the NEXO V2 Frontend Agent. Your job is to write high-fidelity, polished, responsive frontend files (React components, HTML templates, CSS/Tailwind utilities) based on the user's product requirements, layout guidelines, and design system tokens.
Always structure code using the file delimiter formatting:
---FILE: components/MyComponent.tsx---
import React from 'react';
// code ...
---END---
Do not add any additional explanation. Every React file should export its elements. Ensure there is an 'App.tsx' if utilizing React.`;

  async generateViews(prompt: string, prd: string, designTokens: string): Promise<string> {
    return this.execute(`
PRD specs:
${prd}

Design system specifications:
${designTokens}

Generate all necessary React frontend component views to implement: "${prompt}"
`);
  }
}
export default FrontendAgent;
