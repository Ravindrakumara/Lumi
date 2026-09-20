import { useCallback, useRef } from "react";
import { isAxiosError } from "axios";
import { voiceApi } from "../api/voiceApi";
import { useSettingsStore } from "../store/settingsStore";

function cleanSpokenText(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, "I have included a code block on screen.")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/[#*_~>|]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

interface UseVoicePlaybackOptions {
  /** Fired when the backend rejects with 429 (daily voice quota reached) -
   * deliberately NOT treated the same as "server unreachable": falling
   * back to the browser's own TTS on a quota block would silently defeat
   * the whole point of the quota. */
  onQuotaExceeded?: (message: string) => void;
}

/** Plays assistant text via the backend's TTS engines (see /api/tts).
 * Falls back to the browser's built-in speechSynthesis only if our own
 * server is unreachable - that server already has its own offline
 * (pyttsx3) fallback for "no internet", so this is a last resort, not
 * the primary offline path.
 *
 * speak() resolves only once playback has actually FINISHED (not once it
 * has started - audio.play()'s own promise resolves on start, which is
 * the wrong signal here) - useVoiceConversation's hands-free loop needs
 * this to know when it's safe to start listening again, so it doesn't
 * pick up the assistant's own voice as the next thing to transcribe. */
export function useVoicePlayback({ onQuotaExceeded }: UseVoicePlaybackOptions = {}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { voiceName, voiceMode } = useSettingsStore();

  const speak = useCallback(
    async (text: string): Promise<void> => {
      const spokenText = cleanSpokenText(text || "");
      if (!spokenText) return;

      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      try {
        const blob = await voiceApi.synthesize(spokenText, voiceName, voiceMode);
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioRef.current = audio;

        await new Promise<void>((resolve) => {
          audio.addEventListener(
            "ended",
            () => {
              URL.revokeObjectURL(url);
              resolve();
            },
            { once: true }
          );
          audio.addEventListener(
            "error",
            () => {
              URL.revokeObjectURL(url);
              resolve();
            },
            { once: true }
          );
          audio.play().catch(() => resolve());
        });
      } catch (err) {
        if (isAxiosError(err) && err.response?.status === 429) {
          onQuotaExceeded?.(
            err.response.data?.error || "You've reached your daily voice limit."
          );
          return;
        }

        // Genuine "can't reach our own server" case - last-resort fallback.
        if (window.speechSynthesis) {
          await new Promise<void>((resolve) => {
            const utterance = new SpeechSynthesisUtterance(spokenText);
            utterance.lang = "en-US";
            utterance.addEventListener("end", () => resolve(), { once: true });
            utterance.addEventListener("error", () => resolve(), { once: true });
            window.speechSynthesis.cancel();
            window.speechSynthesis.speak(utterance);
          });
        }
      }
    },
    [voiceName, voiceMode, onQuotaExceeded]
  );

  return { speak };
}
