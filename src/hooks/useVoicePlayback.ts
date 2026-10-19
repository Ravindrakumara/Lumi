import { useCallback, useEffect, useRef, useState } from "react";
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
 * pick up the assistant's own voice as the next thing to transcribe.
 *
 * stop() exists because a learner must always be able to cut the
 * assistant off mid-sentence - without it a long reply traps them until
 * it finishes. */
export function useVoicePlayback({ onQuotaExceeded }: UseVoicePlaybackOptions = {}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);
  // Lets an in-flight speak() know it was cancelled while it was still
  // waiting on the network, so it never starts playing after a stop().
  const generationRef = useRef(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const { voiceName, voiceMode } = useSettingsStore();

  const stop = useCallback(() => {
    generationRef.current += 1;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  // Never let audio outlive the screen that started it.
  useEffect(() => stop, [stop]);

  const speak = useCallback(
    async (text: string): Promise<void> => {
      const spokenText = cleanSpokenText(text || "");
      if (!spokenText) return;

      stop();
      const generation = generationRef.current;
      setIsSpeaking(true);

      try {
        const blob = await voiceApi.synthesize(spokenText, voiceName, voiceMode);
        if (generation !== generationRef.current) return; // stopped while fetching
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioRef.current = audio;
        urlRef.current = url;

        await new Promise<void>((resolve) => {
          const finish = () => {
            if (urlRef.current === url) {
              URL.revokeObjectURL(url);
              urlRef.current = null;
            }
            resolve();
          };
          audio.addEventListener("ended", finish, { once: true });
          audio.addEventListener("error", finish, { once: true });
          audio.play().catch(() => finish());
        });
      } catch (err) {
        if (isAxiosError(err) && err.response?.status === 429) {
          onQuotaExceeded?.(err.response.data?.error || "You've reached your daily voice limit.");
          return;
        }

        // Genuine "can't reach our own server" case - last-resort fallback.
        if (generation === generationRef.current && window.speechSynthesis) {
          await new Promise<void>((resolve) => {
            const utterance = new SpeechSynthesisUtterance(spokenText);
            utterance.lang = "en-US";
            utterance.addEventListener("end", () => resolve(), { once: true });
            utterance.addEventListener("error", () => resolve(), { once: true });
            window.speechSynthesis.cancel();
            window.speechSynthesis.speak(utterance);
          });
        }
      } finally {
        if (generation === generationRef.current) setIsSpeaking(false);
      }
    },
    [voiceName, voiceMode, onQuotaExceeded, stop]
  );

  return { speak, stop, isSpeaking };
}
