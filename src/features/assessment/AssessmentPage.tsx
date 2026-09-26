import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { assessmentApi } from "../../api/assessmentApi";
import Badge from "../../components/atoms/Badge";
import Button from "../../components/atoms/Button";
import Input from "../../components/atoms/Input";
import Orb, { type OrbState } from "../../components/atoms/Orb";
import Spinner from "../../components/atoms/Spinner";
import ChatBubble from "../../components/molecules/ChatBubble";
import { useVoiceConversation } from "../../hooks/useVoiceConversation";
import type { AcousticFeatures, AssessmentResult, AssessmentTurn } from "../../types";

const DIMENSIONS: { key: keyof AssessmentResult; label: string }[] = [
  { key: "vocabulary", label: "Vocabulary" },
  { key: "sentence_complexity", label: "Sentence complexity" },
  { key: "grammar_accuracy", label: "Grammar accuracy" },
  { key: "fluency_hesitation", label: "Fluency & hesitation" },
  { key: "pronunciation", label: "Pronunciation" },
];

const ORB_STATE: Record<string, OrbState> = {
  listening: "listening",
  transcribing: "thinking",
  responding: "speaking",
};

const PHASE_LABEL: Record<string, string> = {
  idle: "Tap to start talking",
  listening: "Listening…",
  transcribing: "One moment…",
  responding: "Lumi's replying…",
};

/** AC-1/AC-3: this is the very first thing a learner sees after plan
 * selection, before any lesson content - and it deliberately looks like
 * an ordinary conversation, never a visible test/quiz screen.
 *
 * Voice-first by design, not a manual push-to-talk-then-click-send
 * toggle next to a text box - AC-6 needs pronunciation measured "during
 * the conversation", which only reliably happens if voice is the
 * natural default a learner falls into, not an easy-to-skip option next
 * to typing. Modeled directly on VoiceModePage.tsx's hands-free loop
 * (same useVoiceConversation hook, includeAcousticFeatures: true) so
 * the phase (listening/thinking/replying) is always visible - the
 * earlier push-to-talk version left learners unsure whether anything
 * was happening at all. Typing is still available as an explicit
 * fallback (mic-unsupported browsers, or just personal preference), one
 * tap away via "Prefer to type?".
 *
 * See app/assessment_engine.py for the actual conversation/grading
 * logic; this component is a thin UI over it. */
export default function AssessmentPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [transcript, setTranscript] = useState<AssessmentTurn[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [preferTyping, setPreferTyping] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const completedRef = useRef(false);

  const { isLoading } = useQuery({
    queryKey: ["assessment-start"],
    queryFn: async () => {
      const session = await assessmentApi.start();
      setSessionId(session.id);
      setTranscript(session.transcript);
      return session;
    },
  });

  const respondMutation = useMutation({
    mutationFn: ({ message, acousticFeatures }: { message: string; acousticFeatures?: AcousticFeatures }) =>
      assessmentApi.respond(sessionId!, message, acousticFeatures),
    onSuccess: (data) => {
      setTranscript((prev) => [...prev, { role: "assistant", text: data.reply }]);
      if (data.completed && data.result) {
        completedRef.current = true;
        setResult(data.result);
        // The dashboard gate (LearnerLayout) reads profile.cefr_level -
        // invalidate it now so navigating there doesn't show a stale
        // "still gated" redirect back to this page.
        queryClient.invalidateQueries({ queryKey: ["profile"] });
      }
    },
  });

  const conversation = useVoiceConversation({
    includeAcousticFeatures: true,
    onUtterance: async (text, acousticFeatures) => {
      setTranscript((prev) => [...prev, { role: "user", text }]);
      await respondMutation.mutateAsync({ message: text, acousticFeatures });
      // The engine itself decides when the assessment is done (AC-7) -
      // once it does, stop the hands-free loop so the mic doesn't stay
      // hot on the result screen.
      if (completedRef.current) conversation.stopConversation();
    },
    onError: (message) => {
      if (!conversation.isActive) setVoiceError(message);
    },
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [transcript]);

  useEffect(() => {
    return () => conversation.stopConversation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const message = draft.trim();
    if (!message || respondMutation.isPending) return;
    setTranscript((prev) => [...prev, { role: "user", text: message }]);
    setDraft("");
    respondMutation.mutate({ message });
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-cream dark:bg-ink-950">
        <Spinner size={28} />
      </div>
    );
  }

  if (result) {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-6 bg-cream p-6 text-center dark:bg-ink-950">
        <Orb size={96} state="idle" />
        <div>
          <p className="text-sm font-semibold text-slate-500 dark:text-ink-400">Your English level</p>
          <p className="font-display text-6xl font-extrabold text-brand-500 dark:text-live-500">
            {result.cefr_level}
          </p>
          {result.capped_at_max ? <Badge tone="brand">Top level - advanced content unlocked</Badge> : null}
        </div>

        <div className="w-full space-y-3 rounded-2xl border border-slate-200 bg-white p-[22px] text-left dark:border-ink-700 dark:bg-ink-900">
          {DIMENSIONS.map(({ key, label }) => {
            const dim = result[key] as { score: number | null; evidence: string };
            return (
              <div key={key} className="flex items-center justify-between gap-3 text-[13px]">
                <span className="text-slate-500 dark:text-ink-400">{label}</span>
                <span className="font-bold text-ink-900 dark:text-ink-100">
                  {dim.score !== null ? `${dim.score}/6` : "Not assessed"}
                </span>
              </div>
            );
          })}
        </div>

        {result.low_confidence ? (
          <p className="rounded-[10px] border border-[#ffd9c7] bg-[#fff5f1] px-3.5 py-2.5 text-[12.5px] text-[#7c2d12]">
            This result is a rough estimate - we didn't get quite enough to work with. You can retake the
            assessment any time from Settings.
          </p>
        ) : null}

        <button
          type="button"
          onClick={() => navigate("/", { replace: true })}
          className="w-full rounded-full bg-brand-500 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-600"
        >
          Continue to my dashboard →
        </button>
      </div>
    );
  }

  const phase = conversation.isActive ? conversation.phase : "idle";

  return (
    <div className="mx-auto flex h-screen max-w-2xl flex-col bg-cream p-4 dark:bg-ink-950 sm:p-6">
      <div className="mb-4">
        <h1 className="font-display text-[26px] font-extrabold text-ink-900 dark:text-ink-100">
          Let's get to know your English! 👋
        </h1>
        <p className="mt-1 text-[14.5px] text-slate-500 dark:text-ink-400">
          Just talk naturally with Lumi for a few minutes - no right or wrong answers here.
        </p>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 space-y-3 overflow-y-auto rounded-[20px] bg-[#f2f2f4] p-4 dark:bg-ink-800/40"
      >
        {transcript.map((turn, i) => (
          <ChatBubble key={i} role={turn.role} text={turn.text} />
        ))}
      </div>

      {preferTyping ? (
        <form className="mt-3 flex items-center gap-2" onSubmit={handleSubmit}>
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Type your reply…"
            disabled={respondMutation.isPending || !sessionId}
          />
          <Button type="submit" loading={respondMutation.isPending} className="px-4">
            Send
          </Button>
          <button
            type="button"
            onClick={() => setPreferTyping(false)}
            className="shrink-0 text-xs text-slate-500 hover:underline dark:text-ink-400"
          >
            Use voice
          </button>
        </form>
      ) : conversation.isSupported ? (
        <div className="mt-3 flex flex-col items-center gap-3 overflow-hidden rounded-2xl border border-[#16224a] bg-[radial-gradient(ellipse_80%_60%_at_50%_28%,#16255c,#050a1c_70%)] py-7">
          {/* Always-visible phase state - the earlier version's silent
              mic toggle was exactly what left learners unsure whether
              the assessment was actually progressing. The orb carries
              that state now, same as the chat surface. */}
          <button
            type="button"
            className="orb-btn disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!sessionId}
            aria-pressed={conversation.isActive}
            onClick={() => {
              if (conversation.isActive) {
                conversation.stopConversation();
              } else {
                setVoiceError(null);
                conversation.startConversation();
              }
            }}
          >
            <Orb
              size={112}
              state={ORB_STATE[phase] ?? "idle"}
              levelRef={conversation.levelRef}
              label={PHASE_LABEL[phase]}
            />
          </button>

          <p className="text-[13.5px] font-semibold text-[#93a9d8]">{PHASE_LABEL[phase]}</p>

          <button
            type="button"
            disabled={!sessionId}
            onClick={() => {
              if (conversation.isActive) {
                conversation.stopConversation();
              } else {
                setVoiceError(null);
                conversation.startConversation();
              }
            }}
            className={`rounded-full px-7 py-2.5 text-[13px] font-bold text-white transition-colors disabled:opacity-60 ${
              conversation.isActive ? "bg-ink-900 hover:bg-ink-800 dark:bg-ink-700" : "bg-brand-500 hover:bg-brand-600"
            }`}
          >
            {conversation.isActive ? "Pause" : "Start talking"}
          </button>

          {voiceError ? (
            <p className="max-w-xs text-center text-xs text-red-600 dark:text-red-400">{voiceError}</p>
          ) : null}

          <button
            type="button"
            onClick={() => setPreferTyping(true)}
            className="text-[11.5px] text-[#6b7ea8] hover:underline"
          >
            Prefer to type?
          </button>
        </div>
      ) : (
        // No mic support at all (unsupported browser) - go straight to
        // the typed form rather than showing a voice UI that can't work.
        <form className="mt-3 flex items-center gap-2" onSubmit={handleSubmit}>
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Type your reply…"
            disabled={respondMutation.isPending || !sessionId}
          />
          <Button type="submit" loading={respondMutation.isPending} className="px-4">
            Send
          </Button>
        </form>
      )}
    </div>
  );
}
