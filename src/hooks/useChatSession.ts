import { useMutation } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { useEffect, useRef } from "react";
import { chatApi } from "../api/chatApi";
import { useChatStore } from "../store/chatStore";
import { useSettingsStore } from "../store/settingsStore";
import { useVoicePlayback } from "./useVoicePlayback";

interface UseChatSessionOptions {
  /** Fired when the daily chat quota (not voice quota) is hit - the
   * caller decides what that means for it (e.g. stopping the voice loop,
   * or just showing the upgrade banner). */
  onQuotaExceeded?: () => void;
  /** Asked at reply time whether to speak this reply aloud. A callback,
   * not a boolean, so it always reflects the live mode: the caller flips
   * into voice mode in the same render that the hook runs, and a plain
   * value would be read one render stale. True only for the hands-free
   * voice loop; typing should never be talked at unprompted - text mode
   * offers a speaker button per message instead. */
  shouldSpeak?: () => boolean;
}

/** One conversation, shared by the typed-chat screen and the dedicated
 * Voice Mode screen (see chatStore.ts) - both call this hook so a
 * message sent from either surface shows up in both, and so the
 * send/quota/speak logic exists in exactly one place instead of being
 * duplicated per screen. */
export function useChatSession({ onQuotaExceeded, shouldSpeak }: UseChatSessionOptions = {}) {
  const messages = useChatStore((s) => s.messages);
  const quotaExceeded = useChatStore((s) => s.quotaExceeded);
  const addMessage = useChatStore((s) => s.addMessage);
  const setQuotaExceeded = useChatStore((s) => s.setQuotaExceeded);
  const agentName = useSettingsStore((s) => s.agentName);

  // Lets sendAndWaitForReply() know when a turn (LLM response AND its
  // spoken playback) has fully finished - the hands-free voice loop
  // needs this so it doesn't start listening again while the assistant
  // is still talking (it would just transcribe its own voice).
  const turnCompleteResolverRef = useRef<(() => void) | null>(null);

  const shouldSpeakRef = useRef(shouldSpeak);
  useEffect(() => {
    shouldSpeakRef.current = shouldSpeak;
  }, [shouldSpeak]);

  const { speak, stop: stopSpeaking, isSpeaking } = useVoicePlayback({
    onQuotaExceeded: (message) => {
      addMessage({ role: "assistant", text: `🔒 ${message}` });
    },
  });

  const sendMutation = useMutation({
    mutationFn: (text: string) => chatApi.send(text, "default", agentName),
    onSuccess: async (responseText) => {
      // Stored as the model's raw Markdown - ChatBubble escapes and
      // renders it, so nothing here needs to pre-mangle line breaks.
      addMessage({ role: "assistant", text: responseText });
      if (shouldSpeakRef.current?.()) await speak(responseText);
      turnCompleteResolverRef.current?.();
      turnCompleteResolverRef.current = null;
    },
    onError: (err) => {
      // A 429 carries the real "daily limit reached" message in the body -
      // show that instead of a generic failure message.
      const isQuota = isAxiosError(err) && err.response?.status === 429;
      const text = isQuota
        ? `🔒 ${err.response?.data?.response || "Daily chat limit reached."}`
        : "Sorry, something went wrong. Please try again.";
      addMessage({ role: "assistant", text });
      if (isQuota) {
        setQuotaExceeded(true);
        onQuotaExceeded?.();
      }
      turnCompleteResolverRef.current?.();
      turnCompleteResolverRef.current = null;
    },
  });

  function send(text: string) {
    if (!text.trim() || sendMutation.isPending) return;
    addMessage({ role: "user", text });
    sendMutation.mutate(text);
  }

  /** Same send as typed chat, but resolves only once the reply has been
   * fully spoken - what the hands-free voice loop awaits between turns. */
  function sendAndWaitForReply(text: string): Promise<void> {
    return new Promise((resolve) => {
      turnCompleteResolverRef.current = resolve;
      send(text);
    });
  }

  return {
    messages,
    quotaExceeded,
    isPending: sendMutation.isPending,
    send,
    sendAndWaitForReply,
    /** On-demand playback for the per-message speaker button. */
    speak,
    stopSpeaking,
    isSpeaking,
  };
}
