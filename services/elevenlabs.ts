import { ELEVEN_LABS_CONFIG } from "../constants";

export interface VoiceSettings {
  stability: number;
  similarity_boost: number;
  style?: number;
  use_speaker_boost?: boolean;
}

export const DEFAULT_SETTINGS: VoiceSettings = {
  stability: 0.4, // Lower stability for more natural variation
  similarity_boost: 0.75,
  style: 0.35, // Increased style for more expression
  use_speaker_boost: true,
};

/**
 * Returns a preset configuration for voice settings based on the desired context/emotion.
 */
export const getVoiceSettingsForContext = (context: 'neutral' | 'expressive' | 'authoritative' | 'whisper' = 'neutral'): VoiceSettings => {
  switch (context) {
    case 'expressive': // Good for storytelling or excitement
      return { ...DEFAULT_SETTINGS, stability: 0.3, style: 0.6, similarity_boost: 0.8 };
    case 'authoritative': // Good for formal commands or news
      return { ...DEFAULT_SETTINGS, stability: 0.8, style: 0.1, similarity_boost: 0.6 };
    case 'whisper': // Softer, closer sound
      return { ...DEFAULT_SETTINGS, stability: 0.5, style: 0.0, similarity_boost: 0.5 };
    case 'neutral':
    default:
      return DEFAULT_SETTINGS;
  }
};

export const speakText = async (
  text: string, 
  settingsOverride?: Partial<VoiceSettings>,
  apiKey?: string
): Promise<HTMLAudioElement> => {
  if (!text) throw new Error("No text provided for synthesis");

  // Merge defaults with any overrides provided
  const finalSettings = { ...DEFAULT_SETTINGS, ...settingsOverride };
  const keyToUse = apiKey || ELEVEN_LABS_CONFIG.apiKey;
  
  if (!keyToUse) {
     throw new Error("No API Key configured.");
  }

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${ELEVEN_LABS_CONFIG.voiceId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': keyToUse,
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: finalSettings,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      let detailedMsg = errorText;

      // Try to parse JSON error details
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.detail?.message) {
           detailedMsg = errorJson.detail.message;
        } else if (errorJson.detail?.status) {
           detailedMsg = `${errorJson.detail.status}`;
        }
      } catch (e) {
        // Fallback to raw text if not JSON
      }

      // Simplify common error codes
      if (response.status === 401) throw new Error(`Invalid API Key: ${detailedMsg}`);
      if (response.status === 429) throw new Error(`Quota Exceeded: ${detailedMsg}`);
      
      throw new Error(`TTS Error (${response.status}): ${detailedMsg}`);
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    return audio;
  } catch (error) {
    console.error("TTS Error:", error);
    throw error; // Re-throw to allow UI to handle it
  }
};