export const APP_NAME = "NEXO";

export const COLORS = {
  primary: '#2B6CFF',
  background: '#071024',
  text: '#E6EEF8',
  muted: '#9FB0D6',
  success: '#26D07B'
};

export const ELEVEN_LABS_CONFIG = {
  apiKey: 'sk_e8ef01d93be3ddfe8bfd93f57f1e031c842ab8381457588b',
  voiceId: 'UgBBYS2sOqTuMpoF3BR0'
};

// Payment Config
export const PREMIUM_COST = "₹199";
export const UPI_ID = "chetanpatel323@fam";

// Models
export const AI_MODELS = {
  NEXO_V2: {
    id: 'tngtech/deepseek-r1t2-chimera:free', // Updated to DeepSeek R1 Chimera model
    name: 'NEXO v2 (DeepSeek)',
    provider: 'openai', 
    description: 'Versatile reasoning via OpenRouter (Premium).',
    isPremium: true
  },
  NEXO_FLEX: {
    id: 'gemini-2.5-flash',
    name: 'NEXO Flex (Gemini)',
    provider: 'google',
    description: 'High speed, tool-capable, native integration (Free).',
    isPremium: false
  }
};

export const GEMINI_MODEL = AI_MODELS.NEXO_FLEX.id;