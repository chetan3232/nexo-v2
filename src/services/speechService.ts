/**
 * SpeechService — Web Speech API wrapper for voice-to-app generation.
 * Provides real-time interim transcript streaming and final result callbacks.
 */

type TranscriptCallback = (transcript: string, isFinal: boolean) => void;
type ErrorCallback = (error: string) => void;

// Check browser support
const SpeechRecognition =
  typeof window !== "undefined"
    ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    : null;

class SpeechServiceClass {
  private recognition: any | null = null;
  private _isListening = false;
  private silenceTimeout: ReturnType<typeof setTimeout> | null = null;
  private silenceDelay = 3000; // Auto-stop after 3s silence
  private onTranscript: TranscriptCallback | null = null;
  private onError: ErrorCallback | null = null;

  get isSupported(): boolean {
    return !!SpeechRecognition;
  }

  get isListening(): boolean {
    return this._isListening;
  }

  /**
   * Start listening for speech input.
   * @param onTranscript - Called with (transcript, isFinal) on each recognition result
   * @param onError - Called on errors
   * @param language - BCP-47 language code (default: "en-US")
   */
  startListening(
    onTranscript: TranscriptCallback,
    onError?: ErrorCallback,
    language: string = "en-US"
  ): boolean {
    if (!this.isSupported) {
      onError?.("Speech recognition is not supported in this browser.");
      return false;
    }

    if (this._isListening) {
      this.stopListening();
    }

    this.onTranscript = onTranscript;
    this.onError = onError || null;

    try {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = language;
      this.recognition.maxAlternatives = 1;

      this.recognition.onstart = () => {
        this._isListening = true;
      };

      this.recognition.onresult = (event: any) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        // Reset silence timer on each result
        this.resetSilenceTimer();

        if (finalTranscript) {
          this.onTranscript?.(finalTranscript.trim(), true);
        } else if (interimTranscript) {
          this.onTranscript?.(interimTranscript.trim(), false);
        }
      };

      this.recognition.onerror = (event: any) => {
        const errorMap: Record<string, string> = {
          "not-allowed": "Microphone access was denied. Please allow microphone permission.",
          "no-speech": "No speech detected. Please try again.",
          "network": "Network error occurred during speech recognition.",
          "audio-capture": "No microphone was found. Please connect a microphone.",
          "aborted": "Speech recognition was aborted.",
        };
        const message = errorMap[event.error] || `Speech recognition error: ${event.error}`;
        this.onError?.(message);
        this._isListening = false;
        this.clearSilenceTimer();
      };

      this.recognition.onend = () => {
        this._isListening = false;
        this.clearSilenceTimer();
      };

      this.recognition.start();
      this.resetSilenceTimer();
      return true;
    } catch (err: any) {
      this.onError?.(`Failed to start speech recognition: ${err.message}`);
      return false;
    }
  }

  /**
   * Stop listening.
   */
  stopListening() {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {}
      this.recognition = null;
    }
    this._isListening = false;
    this.clearSilenceTimer();
  }

  /**
   * Toggle listening state.
   */
  toggle(
    onTranscript: TranscriptCallback,
    onError?: ErrorCallback,
    language?: string
  ): boolean {
    if (this._isListening) {
      this.stopListening();
      return false;
    } else {
      return this.startListening(onTranscript, onError, language);
    }
  }

  private resetSilenceTimer() {
    this.clearSilenceTimer();
    this.silenceTimeout = setTimeout(() => {
      if (this._isListening) {
        this.stopListening();
      }
    }, this.silenceDelay);
  }

  private clearSilenceTimer() {
    if (this.silenceTimeout) {
      clearTimeout(this.silenceTimeout);
      this.silenceTimeout = null;
    }
  }
}

export const SpeechService = new SpeechServiceClass();
