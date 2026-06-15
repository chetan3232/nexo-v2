import { BaseAgent } from './BaseAgent';

export class CloningAgent extends BaseAgent {
  name = 'Cloning Agent';
  systemPrompt = `You are the NEXO V2 Cloning Agent. Your job is to analyze website URLs (layout grids, buttons, color palettes, fonts styling) and reconstruct the UI as a single, clean, editable React component file.
Always structure code using the file delimiter formatting:
---FILE: App.tsx---
// code ...
---END---
Do not add any additional explanation. Output ONLY the file block.`;

  async clone(url: string): Promise<string> {
    console.log(`[CloningAgent] Scraping layout data from: ${url}...`);
    return this.execute(`
Observe and clone the web page URL layout: "${url}"
Extract typography, colors, structure, and buttons.
Output the reconstructed React layout in App.tsx.
`);
  }
}
export default CloningAgent;
