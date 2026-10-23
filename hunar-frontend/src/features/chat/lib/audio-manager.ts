/**
 * Global Audio Manager singleton to prevent overlapping voice message playback.
 * Ensures that playing any voice note immediately pauses any other voice note currently playing.
 */

type StopCallback = () => void;

class GlobalAudioManager {
  private currentAudio: HTMLAudioElement | null = null;
  private currentStopCallback: StopCallback | null = null;

  public play(audio: HTMLAudioElement, onStop?: StopCallback): void {
    if (this.currentAudio && this.currentAudio !== audio) {
      try {
        this.currentAudio.pause();
      } catch (err) {
        console.warn("[GlobalAudioManager] Failed to pause previous audio:", err);
      }
      if (this.currentStopCallback) {
        this.currentStopCallback();
      }
    }

    this.currentAudio = audio;
    this.currentStopCallback = onStop || null;
  }

  public stop(audio?: HTMLAudioElement): void {
    if (!audio || this.currentAudio === audio) {
      if (this.currentAudio) {
        try {
          this.currentAudio.pause();
        } catch {
          // ignore
        }
      }
      if (this.currentStopCallback) {
        this.currentStopCallback();
      }
      this.currentAudio = null;
      this.currentStopCallback = null;
    }
  }

  public isCurrentlyPlaying(audio: HTMLAudioElement): boolean {
    return this.currentAudio === audio && !audio.paused;
  }
}

export const audioManager = new GlobalAudioManager();
