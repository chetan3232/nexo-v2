import { BaseAgent } from './BaseAgent';
import { DesignTokens } from '../types';

export class DesignerAgent extends BaseAgent {
  name = 'Designer Agent';
  systemPrompt = `You are the NEXO V2 Designer Agent. Your goal is to analyze the user's prompt and extract custom theme tokens for primary color, accent color, borders, and typography.
You must output a JSON object matching the DesignTokens interface. Do not include markdown formatting or explanations, output ONLY the raw JSON string.

DesignTokens Interface:
{
  "themeMode": "light" | "dark" | "custom",
  "primaryColor": "hex-color-code",
  "accentColor": "hex-color-code",
  "borderRadius": "md" | "lg" | "full",
  "fontFamily": "Inter" | "Outfit" | "Geist"
}

Example Output:
{"themeMode":"dark","primaryColor":"#6366f1","accentColor":"#f97316","borderRadius":"lg","fontFamily":"Inter"}`;

  async generateDesignSystem(prompt: string): Promise<DesignTokens> {
    const raw = await this.execute(`Define style tokens matching the vibe of: "${prompt}"`);
    try {
      const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleaned);
    } catch (e) {
      console.error("Failed to parse design system JSON, returning defaults", e, raw);
      return {
        themeMode: 'dark',
        primaryColor: '#6366f1',
        accentColor: '#f97316',
        borderRadius: 'lg',
        fontFamily: 'Inter',
      };
    }
  }
}
export default DesignerAgent;
