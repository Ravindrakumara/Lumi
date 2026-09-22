import { MicrophoneIcon, StopIcon } from "@heroicons/react/24/solid";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { assessmentApi } from "../../api/assessmentApi";
import { speechApi } from "../../api/speechApi";
import Badge from "../../components/atoms/Badge";
import Button from "../../components/atoms/Button";
import Input from "../../components/atoms/Input";
import Spinner from "../../components/atoms/Spinner";
import ChatBubble from "../../components/molecules/ChatBubble";
import { useAudioRecorder } from "../../hooks/useAudioRecorder";
import type { AcousticFeatures, AssessmentResult, AssessmentTurn } from "../../types";

const DIMENSIONS: { key: keyof AssessmentResult; label: string }[] = [
  { key: "vocabulary", label: "Vocabulary" },
  { key: "sentence_complexity", label: "Sentence complexity" },
  { key: "grammar_accuracy", label: "Grammar accuracy" },
  { key: "fluency_hesitation", label: "Fluency & hesitation" },
  { key: "pronunciation", label: "Pronunciation" },
];

/** AC-1/AC-3: this is the very first thing a learner sees after plan
 * selection, before any lesson content - and it deliberately looks like
 * an ordinary chat, never a visible test/quiz screen. See
 * app/assessment_engine.py for the actual conversation/grading logic;
 * this component is a thin chat UI over it, same relationship
 * ChatWindow.tsx has to the general chat endpoint. */
export default function AssessmentPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [transcript, setTranscript] = useState<AssessmentTurn[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Deliberately not useServerSpeechInput (used elsewhere for chat) -
  // that hook's onResult only ever hands back text, and AC-6 needs the
  // raw acoustic measurement alongside it, so this calls
  // speechApi.transcribeWithAcousticFeatures directly instead.
  const { isRecording, start: startRecording, stop: stopRecording, isSupported } = useAudioRecorder({
    onError: setVoiceError,
  });

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
        setResult(data.result);
        // The dashboard gate (LearnerLayout) reads profile.cefr_level -
        // invalidate it now so navigating there doesn't show a stale
        // "still gated" redirect back to this page.
        queryClient.invalidateQueries({ queryKey: ["profile"] });
      }
    },
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [transcript]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const message = draft.trim();
    if (!message || respondMutation.isPending) return;
    setTranscript((prev) => [...prev, { role: "user", text: message }]);
    setDraft("");
    respondMutation.mutate({ message });
  }

  async function handleMicClick() {
    setVoiceError("");
    if (isRecording) {
      const recorded = await stopRecording();
      if (!recorded) return;
      setIsTranscribing(true);
      try {
        const { text, acousticFeatures } = await speechApi.transcribeWithAcousticFeatures(
          recorded.blob,
          recorded.mimeType
        );
        if (!text.trim()) {
          setVoiceError("Could not understand audio. Please try again or type your message.");
          return;
        }
        setTranscript((prev) => [...prev, { role: "user", text }]);
        respondMutation.mutate({ message: text, acousticFeatures });
      } catch {
        setVoiceError("Could not transcribe audio. Please try again or type your message.");
      } finally {
        setIsTranscribing(false);
      }
    } else {
      startRecording();
    }
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

  return (
    <div className="mx-auto flex h-screen max-w-2xl flex-col bg-slate-50 p-4 dark:bg-ink-950 sm:p-6">
      <div className="mb-3">
        <p className="text-lg font-semibold text-slate-900 dark:text-ink-100">
          Let's get to know your English! 👋
        </p>
        <p className="text-sm text-slate-500 dark:text-ink-400">
          Just chat naturally with Lumi for a few minutes - no right or wrong answers here.
        </p>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto rounded-xl bg-white p-4 dark:bg-ink-900">
        {transcript.map((turn, i) => (
          <ChatBubble key={i} role={turn.role} text={turn.text} />
        ))}
        {respondMutation.isPending ? <ChatBubble role="assistant" text="…" /> : null}
      </div>

      {voiceError ? <p className="mt-2 text-xs text-red-600 dark:text-red-400">{voiceError}</p> : null}

      <form className="mt-3 flex items-center gap-2" onSubmit={handleSubmit}>
        {isSupported ? (
          <div className="relative">
            {isRecording ? (
              <span className="absolute inset-0 animate-ping rounded-lg bg-live-500 opacity-50" />
            ) : null}
            <Button
              type="button"
              variant={isRecording ? "danger" : "secondary"}
              onClick={handleMicClick}
              disabled={isTranscribing || respondMutation.isPending || !sessionId}
              className="relative px-3"
              title={
                isTranscribing
                  ? "Transcribing…"
                  : "Speak your answer - pitch, pace and pauses are measured for your pronunciation score"
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
        ) : null}
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={isRecording ? "Listening…" : isTranscribing ? "Transcribing…" : "Type your reply…"}
          disabled={respondMutation.isPending || !sessionId || isRecording || isTranscribing}
        />
        <Button type="submit" loading={respondMutation.isPending} className="px-4">
          Send
        </Button>
      </form>
    </div>
  );
}
