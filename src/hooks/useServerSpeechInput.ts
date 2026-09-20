import { useCallback, useState } from "react";
import { speechApi } from "../api/speechApi";
import { useAudioRecorder } from "./useAudioRecorder";

interface UseServerSpeechInputOptions {
  onResult?: (transcript: string) => void;
  onError?: (error: string) => void;
}

/** Voice input via server-side offline transcription (Vosk) instead of
 * the browser's Web Speech API. That API needs Chrome's embedded Google
 * API key for its cloud recognition service - open-source Chromium
 * builds (common on Linux) don't have it and always fail with a
 * "network" error, regardless of whether the machine actually has
 * internet access (see useSpeechInput.ts, kept around for browsers where
 * the native API does work). Same public interface as useSpeechInput so
 * callers don't need to change beyond swapping the import. */
export function useServerSpeechInput({ onResult, onError }: UseServerSpeechInputOptions = {}) {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const {
    isRecording,
    start: startRecording,
    stop: stopRecording,
    isSupported,
  } = useAudioRecorder({ onError });

  const start = useCallback(() => {
    startRecording();
  }, [startRecording]);

  const stop = useCallback(() => {
    stopRecording()
      .then(async (recorded) => {
        if (!recorded) return;

        setIsTranscribing(true);
        try {
          const text = await speechApi.transcribe(recorded.blob, recorded.mimeType);
          if (text.trim()) {
            onResult?.(text);
          } else {
            onError?.("Could not understand audio. Please try again or type your message.");
          }
        } catch {
          onError?.("Could not transcribe audio. Please try again or type your message.");
        } finally {
          setIsTranscribing(false);
        }
      })
      .catch(() => setIsTranscribing(false));
  }, [stopRecording, onResult, onError]);

  // isRecording/isTranscribing are exposed separately (not just a single
  // combined "isListening") so the UI can actually show which state it's
  // in - collapsing them looked identical and, worse, left the button
  // clickable (and so double-stoppable, see useAudioRecorder.ts) during
  // the transcribing window.
  return { isListening: isRecording || isTranscribing, isRecording, isTranscribing, start, stop, isSupported };
}
