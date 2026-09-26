import { PaperAirplaneIcon, StopCircleIcon } from "@heroicons/react/24/solid";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Input from "../atoms/Input";
import Orb, { type OrbState } from "../atoms/Orb";
import ChatBubble from "../molecules/ChatBubble";
import VoiceCaptions from "../molecules/VoiceCaptions";
import { useChatSession } from "../../hooks/useChatSession";
import { useVoiceConversation } from "../../hooks/useVoiceConversation";

// Ported from the vanilla app's .quick-actions buttons.
const QUICK_ACTIONS = ["Yes, let's practice", "Teach me something new", "Not now"];

const ORB_STATE: Record<string, OrbState> = {
  listening: "listening",
  transcribing: "thinking",
  responding: "speaking",
};

const HINT: Record<string, string> = {
  idle: "Tap the orb to speak — it listens, thinks, then replies out loud.",
  listening: "Listening… say it whenever you're ready.",
  transcribing: "Thinking…",
  responding: "Replying out loud — the mic reopens when Lumi finishes.",
};

export default function ChatWindow() {
  const [draft, setDraft] = useState("");
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const errorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  // stopConversation is defined below but needed by the quota callback
  // above it - a ref keeps that ordering legal without restructuring.
  const stopRef = useRef<(() => void) | null>(null);
  const voiceActiveRef = useRef(false);

  // Which message the speaker button is currently reading, so only that
  // bubble shows "Stop".
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  // Verbatim speech-to-text output for the last utterance. Shown on
  // screen as it happens so a mis-transcription is visible immediately,
  // rather than only being inferred from a reply about the wrong topic.
  const [heard, setHeard] = useState<string | null>(null);

  const { messages, quotaExceeded, isPending, send, sendAndWaitForReply, speak, stopSpeaking, isSpeaking } =
    useChatSession({
      onQuotaExceeded: () => stopRef.current?.(),
      // Text mode never talks at you unprompted; the hands-free voice
      // loop does, because replying out loud is the whole point of it.
      shouldSpeak: () => voiceActiveRef.current,
    });

  const flashError = useCallback((message: string) => {
    setVoiceError(message);
    if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    errorTimeoutRef.current = setTimeout(() => setVoiceError(null), 4000);
  }, []);

  // Hands-free: one tap on the orb opens the mic for the whole
  // back-and-forth (listen -> transcribe -> reply out loud -> listen
  // again). This used to live on a separate /voice screen; it belongs
  // here, on the orb, which is what the redesign's "tap the orb to
  // speak" affordance promises.
  const conversation = useVoiceConversation({
    onUtterance: (text) => {
      setHeard(text);
      return sendAndWaitForReply(text);
    },
    onError: flashError,
  });

  useEffect(() => {
    stopRef.current = conversation.stopConversation;
  }, [conversation.stopConversation]);

  useEffect(() => {
    voiceActiveRef.current = conversation.isActive;
  }, [conversation.isActive]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    return () => {
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
    };
  }, []);

  const phase = conversation.isActive ? conversation.phase : "idle";
  const lastAssistantMessage = [...messages].reverse().find((m) => m.role === "assistant")?.text ?? null;
  const orbState: OrbState = ORB_STATE[phase] ?? "idle";

  return (
    <div className="flex h-full flex-col">
      <div className="relative flex min-h-0 flex-1 flex-col">
      <div
        ref={scrollRef}
        className="flex-1 space-y-3 overflow-y-auto rounded-[20px] bg-[#f2f2f4] p-4 dark:bg-ink-800/40"
      >
        {messages.map((m, i) => (
          <ChatBubble
            key={i}
            role={m.role}
            text={m.text}
            onSpeak={
              m.role === "assistant" && !conversation.isActive
                ? (text) => {
                    setSpeakingIndex(i);
                    speak(text);
                  }
                : undefined
            }
            onStopSpeaking={stopSpeaking}
            isSpeaking={speakingIndex === i && isSpeaking}
          />
        ))}
        {isPending ? <ChatBubble role="assistant" text="Typing… ⏳" /> : null}
      </div>

      {conversation.isActive ? (
        <VoiceCaptions
          phase={conversation.phase}
          heard={heard}
          reply={phase === "responding" && lastAssistantMessage ? lastAssistantMessage : null}
        />
      ) : null}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {QUICK_ACTIONS.map((sample) => (
          <button
            key={sample}
            type="button"
            disabled={isPending}
            onClick={() => send(sample)}
            className="rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700
              transition-colors hover:border-brand-100 hover:bg-brand-50 hover:text-brand-700 disabled:opacity-50
              dark:border-ink-700 dark:bg-ink-900 dark:text-ink-400 dark:hover:border-live-500/40 dark:hover:bg-live-500/10 dark:hover:text-live-500"
          >
            {sample}
          </button>
        ))}
      </div>

      {isSpeaking ? (
        <div className="mt-2 flex items-center justify-between gap-3 rounded-xl border border-live-500/30 bg-live-500/10 px-3.5 py-2">
          <span className="flex items-center gap-2 text-[12.5px] font-semibold text-live-600 dark:text-live-500">
            <span className="flex h-2 w-2 shrink-0 animate-pulse rounded-full bg-live-500" />
            Lumi is speaking
          </span>
          <button
            type="button"
            onClick={stopSpeaking}
            className="flex shrink-0 items-center gap-1.5 rounded-full bg-live-500 px-3.5 py-1.5 text-xs font-bold text-white transition-colors hover:bg-live-600"
          >
            <StopCircleIcon className="h-4 w-4" />
            Stop
          </button>
        </div>
      ) : null}

      {quotaExceeded ? (
        <div className="mt-2 flex items-center justify-between gap-3 rounded-lg border border-live-500/30 bg-live-500/10 px-3 py-2 text-sm">
          <span className="text-slate-700 dark:text-ink-100">
            You've hit today's free limit. Upgrade for a higher daily allowance.
          </span>
          <Link
            to="/choose-plan"
            className="shrink-0 rounded-lg bg-live-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-live-600"
          >
            View plans
          </Link>
        </div>
      ) : null}

      <form
        className="mt-2 flex items-center gap-2.5 pl-1"
        onSubmit={(e) => {
          e.preventDefault();
          send(draft);
          setDraft("");
        }}
      >
        <button
          type="button"
          className="orb-btn shrink-0 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={() => {
            if (conversation.isActive) {
              conversation.stopConversation();
              setHeard(null);
            } else {
              setVoiceError(null);
              conversation.startConversation();
            }
          }}
          disabled={!conversation.isSupported}
          aria-pressed={conversation.isActive}
          title={
            conversation.isSupported
              ? conversation.isActive
                ? "Stop talking"
                : "Tap to speak"
              : "Voice input is not supported in this browser"
          }
        >
          <Orb
            size={44}
            state={orbState}
            levelRef={conversation.levelRef}
            label={conversation.isActive ? `Voice conversation: ${phase}` : "Microphone, off"}
          />
        </button>
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={conversation.isActive ? HINT[phase] : "Type your message…"}
          className="rounded-[14px] border-slate-200 py-3 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-100"
        />
        {/* A plain button, not <Button>: its base rounded-lg/px-4 win over
            anything passed in className, which turned this into a rounded
            square instead of the design's circle. */}
        <button
          type="submit"
          disabled={isPending}
          aria-label="Send message"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <PaperAirplaneIcon className="h-[18px] w-[18px]" />
        </button>
      </form>

      <p className="mt-1.5 pl-[58px] text-[11.5px] text-slate-400 dark:text-ink-400">
        {voiceError ?? (conversation.isSupported ? HINT[phase] : "Voice input is not supported in this browser.")}
      </p>
    </div>
  );
}
