import { useCallback, useEffect, useRef, useState } from "react";
import { useVoiceActivityDetection } from "./useVoiceActivityDetection";

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
  // Live mic loudness, 0-1, for audio-reactive visuals (see Orb's
  // levelRef). A ref rather than state: this updates every animation
  // frame, and setState at 60fps would re-render the whole page.
  const levelRef = useRef(0);
  // Reused rather than writing a second RMS loop. Only the level reading
  // is wanted here - this surface stops when the learner taps, not when
  // they go quiet, so the silence callback is deliberately a no-op.
  const meter = useVoiceActivityDetection();

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
      meter.start(stream, {
        onSilenceAfterSpeech: () => {},
        onLevel: (level) => {
          levelRef.current = level;
        },
      });
      setIsRecording(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      onError?.(`Could not access microphone: ${message}`);
    }
  }, [onError]);

  const meterRef = useRef(meter);
  meterRef.current = meter;

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
        meterRef.current.stop();
        levelRef.current = 0;
        setIsRecording(false);
        resolve(null);
        return;
      }

      recorder.addEventListener(
        "stop",
        () => {
          const mimeType = recorder.mimeType || "audio/webm";
          const blob = new Blob(chunksRef.current, { type: mimeType });
          meterRef.current.stop();
          levelRef.current = 0;
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
      meterRef.current.stop();
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  return {
    isRecording,
    levelRef,
    start,
    stop,
    isSupported: Boolean(navigator.mediaDevices?.getUserMedia),
  };
}
