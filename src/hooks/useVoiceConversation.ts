import { useCallback, useEffect, useRef, useState } from "react";
import { speechApi } from "../api/speechApi";
import { useVoiceActivityDetection } from "./useVoiceActivityDetection";
import type { AcousticFeatures } from "../types";

export type VoiceConversationPhase = "idle" | "listening" | "transcribing" | "responding";

interface UseVoiceConversationOptions {
  /** Called with each recognized utterance. The hook awaits this before
   * listening again - the caller is expected to send it to the chat AND
   * wait for the spoken reply to finish playing (see ChatWindow.tsx's
   * sendAndWaitForReply), so the mic doesn't reopen while the assistant
   * is still talking and pick up its own voice.
   * acousticFeatures is only populated when includeAcousticFeatures is
   * set - existing callers (ChatWindow's voice mode) get undefined and
   * can ignore the second argument entirely. */
  onUtterance: (text: string, acousticFeatures?: AcousticFeatures) => Promise<void>;
  onError?: (message: string) => void;
  /** Adds pitch/pace/pause measurement to each transcription (US-02's
   * AC-6) - opt-in since it's extra server-side work only the assessment
   * page needs; general chat/voice-mode leave this unset. */
  includeAcousticFeatures?: boolean;
}

/** Hands-free voice mode: holds one open microphone stream for the whole
 * conversation, and loops record -> detect silence -> transcribe ->
 * onUtterance -> listen again, until stopConversation() is called. A
 * different mode from useServerSpeechInput's single push-to-talk turn
 * (manual start/stop per utterance) - ChatWindow toggles between the two
 * rather than running both at once. */
export function useVoiceConversation({
  onUtterance,
  onError,
  includeAcousticFeatures,
}: UseVoiceConversationOptions) {
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState<VoiceConversationPhase>("idle");

  const activeRef = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const vad = useVoiceActivityDetection();

  const releaseStream = useCallback(() => {
    vad.stop();
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      try {
        recorderRef.current.stop();
      } catch {
        // best-effort - track.stop() below is what actually matters
      }
    }
    recorderRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, [vad]);

  const stopConversation = useCallback(() => {
    activeRef.current = false;
    setIsActive(false);
    setPhase("idle");
    releaseStream();
  }, [releaseStream]);

  const listenOnce = useCallback(() => {
    const stream = streamRef.current;
    if (!activeRef.current || !stream) return;

    setPhase("listening");
    const chunks: Blob[] = [];
    const recorder = new MediaRecorder(stream);
    recorder.addEventListener("dataavailable", (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    });
    recorderRef.current = recorder;

    recorder.addEventListener(
      "stop",
      async () => {
        if (!activeRef.current) return;

        const mimeType = recorder.mimeType || "audio/webm";
        const blob = new Blob(chunks, { type: mimeType });
        if (blob.size === 0) {
          listenOnce();
          return;
        }

        setPhase("transcribing");
        try {
          const { text, acousticFeatures } = includeAcousticFeatures
            ? await speechApi.transcribeWithAcousticFeatures(blob, mimeType)
            : { text: await speechApi.transcribe(blob, mimeType), acousticFeatures: undefined };
          if (!activeRef.current) return;
          if (text.trim()) {
            setPhase("responding");
            await onUtterance(text, acousticFeatures);
          }
        } catch {
          onError?.("Could not transcribe that - still listening.");
        }

        if (activeRef.current) listenOnce();
      },
      { once: true }
    );

    recorder.start();
    vad.start(stream, {
      onSilenceAfterSpeech: () => {
        if (recorder.state !== "inactive") recorder.stop();
      },
    });
  }, [onUtterance, onError, vad, includeAcousticFeatures]);

  const startConversation = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      onError?.("Voice mode is not supported in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      activeRef.current = true;
      setIsActive(true);
      listenOnce();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      onError?.(`Could not access microphone: ${message}`);
    }
  }, [listenOnce, onError]);

  // Releases the microphone only on true unmount (e.g. navigating away),
  // not on every re-render - deliberately an empty dependency array.
  // releaseStream's identity changes every render (it depends on `vad`,
  // a fresh object from useVoiceActivityDetection() each time), so
  // depending on it here would re-fire this effect's cleanup on every
  // state update during an active conversation (phase changes, new
  // messages, etc.), killing the microphone moments after it starts.
  // releaseStream only ever touches ref-held state, never render-scoped
  // values, so any render's copy of it behaves identically at unmount.
  useEffect(() => releaseStream, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    isActive,
    phase,
    startConversation,
    stopConversation,
    isSupported: Boolean(navigator.mediaDevices?.getUserMedia),
  };
}
