import { BaseAgent } from "./BaseAgent";
import { Message } from "../types";

export class CloningAgent extends BaseAgent {
  async clone(
    url: string,
    visualData: {
      screenshot: string;
      styles: any;
      colors: string[];
      markdown?: string;
    },
    options: any,
  ): Promise<string> {
    const systemPrompt = `
You are the NEXO UI Clone Master. Your job is to recreate any website based on visual data, style extractions, and scraped markdown content.

INPUTS:
- URL: ${url}
- Color Palette: ${visualData.colors.join(", ")}
- Typography: ${visualData.styles.fontFamily}
- Layout Patterns: ${visualData.styles.layoutType}
${visualData.markdown ? `- Scraped Page Content (Markdown):\n${visualData.markdown}` : ""}

MISSION:
1. Recreate the core sections (Hero, Navbar, Features, Pricing, Footer) with extremely high fidelity.
2. Use Tailwind CSS for styling.
3. Use Framer Motion for any animations you detect.
4. Ensure the code is modular and editable within NEXO.
5. Populate all texts, features, lists, and copy accurately from the Scraped Page Content. No lorem-ipsum.

Output the code using ---FILE: path--- blocks.
        `.trim();

    const prompt = `CLONE WEBSITE: ${url}\n\nPlease recreate the UI using the extracted visual data. Focus on premium aesthetics and responsiveness.`;

    return this.streamResponse({
      model: options.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
    });
  }
}
