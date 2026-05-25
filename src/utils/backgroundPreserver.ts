/**
 * Utility to prevent browser tab throttling and OS suspension when the tab goes to background.
 */
export class BackgroundPreserver {
  private static audioCtx: AudioContext | null = null;
  private static bufferSource: AudioBufferSourceNode | null = null;
  private static wakeLock: any = null;

  public static async activate() {
    console.log("[BackgroundPreserver] Activating background keep-alive...");

    // 1. Silent Audio Loop
    // Playing audio (even silent audio) puts the tab in a "media playing" state,
    // which prevents modern browsers (Chrome/Safari/Firefox) from throttling workers/timers.
    try {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        this.audioCtx = new AudioContextClass();
      }

      if (this.audioCtx.state === "suspended") {
        await this.audioCtx.resume();
      }

      // Create a 1-second silent audio buffer
      const buffer = this.audioCtx.createBuffer(
        1,
        this.audioCtx.sampleRate,
        this.audioCtx.sampleRate
      );
      this.bufferSource = this.audioCtx.createBufferSource();
      this.bufferSource.buffer = buffer;
      this.bufferSource.loop = true;
      this.bufferSource.connect(this.audioCtx.destination);
      this.bufferSource.start();
      console.log("[BackgroundPreserver] Silent audio loop started.");
    } catch (e) {
      console.warn("[BackgroundPreserver] Silent audio loop failed:", e);
    }

    // 2. Screen Wake Lock
    // Prevents device from sleeping or suspending the browser tab
    try {
      if ("wakeLock" in navigator) {
        this.wakeLock = await (navigator as any).wakeLock.request("screen");
        console.log("[BackgroundPreserver] Screen wake lock acquired.");
      }
    } catch (e) {
      console.warn("[BackgroundPreserver] Screen wake lock failed:", e);
    }
  }

  public static deactivate() {
    console.log("[BackgroundPreserver] Deactivating background keep-alive...");

    // Stop audio
    try {
      if (this.bufferSource) {
        this.bufferSource.stop();
        this.bufferSource.disconnect();
        this.bufferSource = null;
      }
      console.log("[BackgroundPreserver] Silent audio loop stopped.");
    } catch (e) {
      // Ignore
    }

    // Release wake lock
    try {
      if (this.wakeLock) {
        this.wakeLock.release();
        this.wakeLock = null;
        console.log("[BackgroundPreserver] Screen wake lock released.");
      }
    } catch (e) {
      // Ignore
    }
  }
}
