import { useCallback, useEffect, useRef, useState } from "react";

interface UseAudioRecorderOptions {
  onError?: (message: string) => void;
}

/** Records real audio via MediaRecorder (for uploading to the backend,
 * e.g. /api/analysis/pronunciation) - a different capture path from
 * useSpeechInput, which only gets browser-transcribed text, never the
 * raw audio itself. */
export function useAudioRecorder({ onError }: UseAudioRecorderOptions = {}) {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const start = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      onError?.("Microphone recording is not supported in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const recorder = new MediaRecorder(stream);
      recorder.addEventListener("dataavailable", (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      });

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      onError?.(`Could not access microphone: ${message}`);
    }
  }, [onError]);

  const stop = useCallback((): Promise<{ blob: Blob; mimeType: string } | null> => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      // Guards a real bug: without this, calling stop() a second time
      // (e.g. a confused double-click while the button still looked
      // "active" during transcription) called recorder.stop() on an
      // already-inactive MediaRecorder, which throws synchronously - the
      // "stop" event that releases the microphone track never fires, so
      // the promise hangs forever and the mic stays hot indefinitely.
      if (!recorder || recorder.state === "inactive") {
        setIsRecording(false);
        resolve(null);
        return;
      }

      recorder.addEventListener(
        "stop",
        () => {
          const mimeType = recorder.mimeType || "audio/webm";
          const blob = new Blob(chunksRef.current, { type: mimeType });
          streamRef.current?.getTracks().forEach((track) => track.stop());
          mediaRecorderRef.current = null;
          setIsRecording(false);
          resolve(blob.size > 0 ? { blob, mimeType } : null);
        },
        { once: true }
      );
      recorder.stop();
    });
  }, []);

  // Releases the microphone if the component using this hook unmounts
  // mid-recording (e.g. the user navigates to another page instead of
  // clicking stop) - without this, only an explicit stop() click ever
  // released the hardware, so the mic stayed hot indefinitely across
  // page navigation, with no way to notice besides the browser's own
  // recording indicator.
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        try {
          mediaRecorderRef.current.stop();
        } catch {
          // Already inactive or otherwise unstoppable - the track.stop()
          // calls below are what actually matters for releasing hardware.
        }
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  return { isRecording, start, stop, isSupported: Boolean(navigator.mediaDevices?.getUserMedia) };
}
