import { useCallback, useRef, useState } from "react";

// The Web Speech API isn't part of TypeScript's standard DOM lib (it's
// still non-standard/vendor-prefixed), so these are minimal ambient types
// covering only what this hook actually uses.
interface SpeechRecognitionResultLike {
  0: { transcript: string };
}
interface SpeechRecognitionEventLike extends Event {
  results: ArrayLike<SpeechRecognitionResultLike>;
}
interface SpeechRecognitionErrorEventLike extends Event {
  error: string;
}
interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
}
type SpeechRecognitionCtorType = new () => SpeechRecognitionLike;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionCtorType;
    webkitSpeechRecognition?: SpeechRecognitionCtorType;
  }
}

const SpeechRecognitionCtor: SpeechRecognitionCtorType | null =
  typeof window !== "undefined" ? window.SpeechRecognition || window.webkitSpeechRecognition || null : null;

interface UseSpeechInputOptions {
  onResult?: (transcript: string) => void;
  onError?: (error: string) => void;
}

/** Voice input via the browser's Web Speech API.
 *
 * Known limitation (unchanged from the vanilla app): this needs the
 * browser's own cloud speech service, so it only works reliably in real
 * Chrome/Edge with internet - Chromium builds and offline sessions will
 * report a "network" error. A real offline alternative (record in-browser,
 * upload, transcribe with Vosk server-side) needs ffmpeg installed on the
 * server first; not built yet. */
export function useSpeechInput({ onResult, onError }: UseSpeechInputOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const start = useCallback(() => {
    if (!SpeechRecognitionCtor) {
      onError?.("not-supported");
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.addEventListener("result", (event) => {
      const { results } = event as SpeechRecognitionEventLike;
      const transcript = Array.from(results)
        .map((result) => result[0].transcript)
        .join("");
      onResult?.(transcript);
    });

    recognition.addEventListener("error", (event) => {
      setIsListening(false);
      onError?.((event as SpeechRecognitionErrorEventLike).error);
    });

    recognition.addEventListener("end", () => setIsListening(false));

    recognitionRef.current = recognition;
    try {
      // .start() can throw synchronously (e.g. InvalidStateError if a
      // previous session hasn't fully torn down yet) - the "error" event
      // only covers failures *after* a session starts, not this. Ported
      // from the vanilla app's try/catch around the same call.
      recognition.start();
      setIsListening(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      onError?.(`could-not-start: ${message}`);
    }
  }, [onResult, onError]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  return { isListening, start, stop, isSupported: Boolean(SpeechRecognitionCtor) };
}
