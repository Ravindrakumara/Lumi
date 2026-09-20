import { MicrophoneIcon, PaperAirplaneIcon, PhoneIcon, StopIcon } from "@heroicons/react/24/solid";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Button from "../atoms/Button";
import Input from "../atoms/Input";
import Spinner from "../atoms/Spinner";
import ChatBubble from "../molecules/ChatBubble";
import { useChatSession } from "../../hooks/useChatSession";
import { useServerSpeechInput } from "../../hooks/useServerSpeechInput";

// Ported from the vanilla app's .quick-actions buttons.
const QUICK_ACTIONS = ["Yes, let's practice", "Teach me something new", "Not now"];

export default function ChatWindow() {
  const { messages, quotaExceeded, isPending, send } = useChatSession();
  const [draft, setDraft] = useState("");
  const [transcriptPreview, setTranscriptPreview] = useState<string | null>(null);
  const previewTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Single push-to-talk turn: click to record, click to stop, one
  // message. The full hands-free back-and-forth loop lives on its own
  // screen now (see VoiceModePage.tsx) - keeping that out of the typed
  // chat surface entirely, rather than toggling behavior on this same
  // mic button, was the whole point of splitting it out.
  const { isRecording, isTranscribing, start, stop, isSupported } = useServerSpeechInput({
    onResult: (transcript) => {
      if (!transcript.trim()) return;
      setTranscriptPreview(transcript);
      if (previewTimeoutRef.current) clearTimeout(previewTimeoutRef.current);
      previewTimeoutRef.current = setTimeout(() => setTranscriptPreview(null), 3000);
      send(transcript);
    },
    onError: (error) => {
      setDraft("");
      setTranscriptPreview(error);
      if (previewTimeoutRef.current) clearTimeout(previewTimeoutRef.current);
      previewTimeoutRef.current = setTimeout(() => setTranscriptPreview(null), 4000);
    },
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    return () => {
      if (previewTimeoutRef.current) clearTimeout(previewTimeoutRef.current);
    };
  }, []);

  return (
    <div className="flex h-full flex-col">
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto rounded-xl bg-slate-50 p-4">
        {messages.map((m, i) => (
          <ChatBubble key={i} role={m.role} text={m.text} />
        ))}
        {isPending ? <ChatBubble role="assistant" text="Typing… ⏳" /> : null}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {QUICK_ACTIONS.map((sample) => (
          <button
            key={sample}
            type="button"
            disabled={isPending}
            onClick={() => send(sample)}
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600
              transition-colors hover:border-brand-100 hover:bg-brand-50 hover:text-brand-700 disabled:opacity-50
              dark:border-ink-700 dark:bg-ink-900 dark:text-ink-400 dark:hover:border-live-500/40 dark:hover:bg-live-500/10 dark:hover:text-live-500"
          >
            {sample}
          </button>
        ))}

        <Link
          to="/voice"
          className="ml-auto flex items-center gap-1.5 rounded-full border border-live-500/40 bg-live-500/10 px-3 py-1 text-xs font-medium text-live-600 transition-colors hover:bg-live-500/20 dark:text-live-500"
        >
          <PhoneIcon className="h-3.5 w-3.5" />
          Voice mode
        </Link>
      </div>

      {transcriptPreview ? (
        <div className="mt-2 rounded-lg border border-slate-200/70 bg-white/70 px-3 py-2 text-sm backdrop-blur-sm dark:border-ink-700/70 dark:bg-ink-900/70">
          <span className="block text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-ink-400">
            You said
          </span>
          <p className="text-slate-700 dark:text-ink-100">{transcriptPreview}</p>
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
        className="mt-2 flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          send(draft);
          setDraft("");
        }}
      >
        <div className="relative">
          {isRecording ? <span className="absolute inset-0 animate-ping rounded-lg bg-live-500 opacity-50" /> : null}
          <Button
            type="button"
            variant={isRecording ? "danger" : "secondary"}
            onClick={() => (isRecording ? stop() : start())}
            disabled={isTranscribing}
            className="relative px-3"
            title={
              isTranscribing
                ? "Transcribing…"
                : isSupported
                  ? "Speak your message"
                  : "Voice input not supported in this browser"
            }
          >
            {isTranscribing ? (
              <Spinner size={16} />
            ) : isRecording ? (
              <StopIcon className="h-4 w-4" />
            ) : (
              <MicrophoneIcon className="h-4 w-4" />
            )}
          </Button>
        </div>
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={isRecording ? "Listening…" : isTranscribing ? "Transcribing…" : "Type your message…"}
        />
        <Button type="submit" loading={isPending} className="px-3">
          <PaperAirplaneIcon className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
