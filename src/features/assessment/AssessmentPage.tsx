import { MicrophoneIcon } from "@heroicons/react/24/solid";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { assessmentApi } from "../../api/assessmentApi";
import Badge from "../../components/atoms/Badge";
import Button from "../../components/atoms/Button";
import Input from "../../components/atoms/Input";
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
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-ink-950">
        <Spinner size={28} />
      </div>
    );
  }

  if (result) {
    return (
      <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-6 bg-slate-50 p-6 text-center dark:bg-ink-950">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-ink-400">Your English level</p>
          <p className="text-5xl font-bold text-brand-600 dark:text-live-500">{result.cefr_level}</p>
          {result.capped_at_max ? (
            <Badge tone="brand">Top level - advanced content unlocked</Badge>
          ) : null}
        </div>

        <div className="w-full space-y-2 rounded-xl border border-slate-200 bg-white p-4 text-left dark:border-ink-700 dark:bg-ink-900">
          {DIMENSIONS.map(({ key, label }) => {
            const dim = result[key] as { score: number | null; evidence: string };
            return (
              <div key={key} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-slate-600 dark:text-ink-400">{label}</span>
                <span className="font-semibold text-slate-900 dark:text-ink-100">
                  {dim.score !== null ? `${dim.score}/6` : "Not assessed"}
                </span>
              </div>
            );
          })}
        </div>

        {result.low_confidence ? (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            This result is a rough estimate - we didn't get quite enough to work with. You can
            retake the assessment any time from Settings.
          </p>
        ) : null}

        <Button className="w-full" onClick={() => navigate("/", { replace: true })}>
          Continue to my dashboard
        </Button>
      </div>
    );
  }

  const phase = conversation.isActive ? conversation.phase : "idle";

  return (
    <div className="mx-auto flex h-screen max-w-2xl flex-col bg-slate-50 p-4 dark:bg-ink-950 sm:p-6">
      <div className="mb-3">
        <p className="text-lg font-semibold text-slate-900 dark:text-ink-100">
          Let's get to know your English! 👋
        </p>
        <p className="text-sm text-slate-500 dark:text-ink-400">
          Just talk naturally with Lumi for a few minutes - no right or wrong answers here.
        </p>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto rounded-xl bg-white p-4 dark:bg-ink-900">
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
        <div className="mt-3 flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white py-4 dark:border-ink-700 dark:bg-ink-900">
          {/* Always-visible phase state - the earlier version's silent
              mic toggle was exactly what left learners unsure whether
              the assessment was actually progressing. */}
          <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-ink-800">
            {phase === "listening" ? (
              <span className="absolute inset-0 animate-ping rounded-full bg-live-500/40" />
            ) : null}
            {phase === "transcribing" || phase === "responding" ? (
              <Spinner size={22} />
            ) : (
              <MicrophoneIcon className={`h-6 w-6 ${phase === "listening" ? "text-live-500" : "text-slate-400"}`} />
            )}
          </div>
          <p className="text-sm font-medium text-slate-700 dark:text-ink-100">{PHASE_LABEL[phase]}</p>

          <Button
            variant={conversation.isActive ? "danger" : "primary"}
            disabled={!sessionId}
            onClick={() => {
              if (conversation.isActive) {
                conversation.stopConversation();
              } else {
                setVoiceError(null);
                conversation.startConversation();
              }
            }}
          >
            {conversation.isActive ? "Pause" : "Start talking"}
          </Button>

          {voiceError ? <p className="max-w-xs text-center text-xs text-red-600 dark:text-red-400">{voiceError}</p> : null}

          <button
            type="button"
            onClick={() => setPreferTyping(true)}
            className="text-xs text-slate-500 hover:underline dark:text-ink-400"
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
