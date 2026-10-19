import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { analysisApi } from "../../api/analysisApi";
import Orb from "../../components/atoms/Orb";
import PronunciationSession from "./PronunciationSession";
import PageHeader from "../../components/atoms/PageHeader";
import Select from "../../components/atoms/Select";
import { useAudioRecorder } from "../../hooks/useAudioRecorder";
import type { PronunciationResult } from "../../types";

const MIME_EXTENSIONS: Record<string, string> = {
  "audio/webm": "webm",
  "audio/ogg": "ogg",
  "audio/mp4": "m4a",
  "audio/wav": "wav",
};

function ScoreRing({ score }: { score: number }) {
  const size = 92;
  const stroke = 5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(1, Math.max(0, score / 100)));

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} strokeWidth={stroke} className="fill-none stroke-slate-100 dark:stroke-ink-800" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="fill-none stroke-live-500 transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-display text-[24px] font-extrabold text-ink-900 dark:text-ink-100">
        {Math.round(score)}
      </span>
    </div>
  );
}

function AccuracyBar({ label, pct }: { label: string; pct: number }) {
  const clamped = Math.min(100, Math.max(0, pct));
  return (
    <div>
      <div className="mb-1.5 flex justify-between text-[12.5px]">
        <span className="font-semibold text-slate-700 dark:text-ink-100">{label}</span>
        <span className="font-bold text-live-600 dark:text-live-500">{Math.round(clamped)}%</span>
      </div>
      <div className="h-[9px] overflow-hidden rounded-[5px] bg-slate-100 dark:bg-ink-800">
        <div className="h-full rounded-[5px] bg-live-500 transition-all duration-700" style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
}

function useElapsedSeconds(active: boolean) {
  const [seconds, setSeconds] = useState(0);
  const startRef = useRef<number>(0);

  useEffect(() => {
    if (!active) {
      setSeconds(0);
      return;
    }
    startRef.current = Date.now();
    const id = setInterval(() => setSeconds(Math.floor((Date.now() - startRef.current) / 1000)), 1000);
    return () => clearInterval(id);
  }, [active]);

  return seconds;
}

/** One flow, not a dashboard: choose a sentence, tap the orb, get a score.
 * The orb is the control here exactly as it is in chat - the assistant
 * should behave the same way wherever it appears. */
export default function PronunciationPracticePage() {
  // Pitched at the learner's measured band. The page used to hold five
  // fixed sentences, so a beginner and an advanced speaker practised the
  // same material - which measures neither of them.
  // The guided four-part loop is the main way in; free practice stays
  // reachable for someone who just wants to say a sentence and see a
  // score, which is a different job from being coached.
  const [mode, setMode] = useState<"session" | "free">("session");

  const { data: history, refetch: refetchHistory } = useQuery({
    queryKey: ["pronunciation", "history"],
    queryFn: analysisApi.pronunciationHistory,
  });

  const { data: practice } = useQuery({
    queryKey: ["pronunciation", "sentences"],
    queryFn: analysisApi.practiceSentences,
  });
  const sentences = practice?.sentences ?? [];
  const [expectedText, setExpectedText] = useState("");
  const current = sentences.find((s) => s.text === expectedText) ?? sentences[0];

  // Settle on the first sentence once the band is known, and re-settle if
  // a re-assessment moves the learner to a different set.
  useEffect(() => {
    if (sentences.length && !sentences.some((s) => s.text === expectedText)) {
      setExpectedText(sentences[0].text);
    }
  }, [sentences, expectedText]);
  const [recordingError, setRecordingError] = useState("");
  const [changingSentence, setChangingSentence] = useState(false);
  // Hearing your own attempt back is most of the value of pronunciation
  // practice - the score alone doesn't tell you what you actually said.
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);

  const { isRecording, levelRef, start, stop, isSupported } = useAudioRecorder({ onError: setRecordingError });

  const analyzeMutation = useMutation({
    mutationFn: ({ blob, mimeType }: { blob: Blob; mimeType: string }) => {
      const ext = MIME_EXTENSIONS[mimeType.split(";")[0]] || "webm";
      return analysisApi.analyzePronunciation(blob, `recording.${ext}`, expectedText);
    },
    // Every scored attempt is stored server-side, so the progress strip
    // and the trouble-word tally are stale the moment one completes.
    onSuccess: () => {
      void refetchHistory();
    },
  });

  const elapsed = useElapsedSeconds(analyzeMutation.isPending);

  // Tapping the orb a second time ends the take and scores it straight
  // away - the old separate "Analyze" button was a step that never had a
  // reason to exist.
  async function handleOrbTap() {
    if (analyzeMutation.isPending) return;
    if (!isRecording) {
      setRecordingError("");
      analyzeMutation.reset();
      setPlaybackUrl((old) => {
        if (old) URL.revokeObjectURL(old);
        return null;
      });
      start();
      return;
    }
    const recorded = await stop();
    if (recorded) {
      setPlaybackUrl(URL.createObjectURL(recorded.blob));
      analyzeMutation.mutate(recorded);
    }
  }

  useEffect(() => {
    return () => {
      if (playbackUrl) URL.revokeObjectURL(playbackUrl);
    };
  }, [playbackUrl]);

  const result = analyzeMutation.data as PronunciationResult | undefined;
  const orbState = isRecording ? "listening" : analyzeMutation.isPending ? "thinking" : "idle";
  const status = isRecording
    ? "Listening — say the sentence above"
    : analyzeMutation.isPending
      ? `Scoring your pronunciation — ${elapsed}s`
      : result
        ? "Tap to try it again"
        : "Tap the orb, then say the sentence";

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <PageHeader
        title="Let's hear you say it"
        subtitle="Real acoustic scoring — phoneme by phoneme, not a language model's guess."
      />

      <div className="flex gap-1.5">
        {([
          ["session", "Guided session"],
          ["free", "Free practice"],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setMode(value)}
            className={`rounded-full px-4 py-1.5 text-[12.5px] font-bold transition-colors ${
              mode === value
                ? "bg-brand-500 text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:border-brand-200 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === "session" ? <PronunciationSession /> : null}

      {mode === "free" ? (
      <div className="flex flex-col items-center gap-5 px-6 py-6">
        <div className="w-full max-w-md text-center">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400 dark:text-ink-400">
            Sentence to practice
            {practice?.cefr_level ? ` · ${practice.cefr_level}` : ""}
          </p>
          {changingSentence ? (
            <div className="mt-2 text-left">
              <Select
                value={expectedText}
                onChange={(value) => {
                  setExpectedText(value);
                  setChangingSentence(false);
                  analyzeMutation.reset();
                }}
                options={sentences.map((s) => ({ value: s.text, label: s.text }))}
              />
            </div>
          ) : (
            <>
              <p className="mt-1.5 font-display text-[19px] font-extrabold text-ink-900 dark:text-ink-100">
                {expectedText || "Loading…"}
              </p>
              {/* What is actually being listened for. Without it the
                  learner has no idea why this sentence and not another. */}
              {current?.focus ? (
                <p className="mt-1 text-[12.5px] font-medium text-brand-600 dark:text-live-500">{current.focus}</p>
              ) : null}
              <button
                type="button"
                onClick={() => setChangingSentence(true)}
                disabled={isRecording || analyzeMutation.isPending}
                className="mt-1.5 text-[11.5px] font-semibold text-slate-500 hover:underline disabled:opacity-40 dark:text-ink-400"
              >
                Change sentence
              </button>
            </>
          )}
        </div>

        {isSupported ? (
          <button
            type="button"
            onClick={handleOrbTap}
            aria-pressed={isRecording}
            className="orb-btn"
            title={isRecording ? "Stop and score" : "Tap to record"}
          >
            <Orb size={132} state={orbState} levelRef={levelRef} label={status} />
          </button>
        ) : (
          <p className="text-sm text-red-300">Microphone recording is not supported in this browser.</p>
        )}

        <p className="text-[13px] font-semibold text-[#93a9d8]">{status}</p>
        {recordingError ? <p className="text-xs text-red-300">{recordingError}</p> : null}
        {analyzeMutation.isError ? (
          <p className="text-xs text-red-300">Scoring failed — tap the orb to try again.</p>
        ) : null}
      </div>
      ) : null}

      {history?.attempt_count ? (
        <div className="rounded-[18px] border border-slate-200 bg-white px-5 py-4 dark:border-ink-700 dark:bg-ink-900">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-[12.5px]">
            <span className="font-bold text-ink-900 dark:text-ink-100">Your practice</span>
            <span className="text-slate-500 dark:text-ink-400">
              {history.attempt_count} attempts · average {history.average_score} · best {history.best_score}
            </span>
          </div>
          {history.trouble_words.length ? (
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400 dark:text-ink-400">
                Trips you up
              </span>
              {history.trouble_words.map((t) => (
                <span
                  key={t.word}
                  className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11.5px] font-semibold text-amber-800 dark:bg-amber-500/10 dark:text-amber-300"
                >
                  {t.word} ×{t.misses}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {mode === "free" && result ? (
        <div className="rounded-[24px] border border-slate-200 bg-white p-6 dark:border-ink-700 dark:bg-ink-900">
          <div className="flex items-center gap-5">
            <ScoreRing score={result.score} />
            <div>
              <div className="font-display text-[17px] font-extrabold text-ink-900 dark:text-ink-100">
                Pronunciation score
              </div>
              <div className="text-[13px] text-slate-500 dark:text-ink-400">
                Out of 100, from the word and sound accuracy below.
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <AccuracyBar label="Word accuracy" pct={(1 - result.differences.word_error_rate) * 100} />
            <AccuracyBar label="Sound (phoneme) accuracy" pct={(1 - result.differences.phoneme_error_rate) * 100} />
          </div>

          <div className="mt-6 border-t border-slate-100 pt-5 dark:border-ink-800">
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="text-[13px] font-bold text-ink-900 dark:text-ink-100">What we heard</span>
              {playbackUrl ? (
                <audio controls src={playbackUrl} className="h-8 max-w-[240px]">
                  <track kind="captions" />
                </audio>
              ) : null}
            </div>
            <p className="rounded-[10px] border border-slate-200 px-3.5 py-3 text-sm italic text-slate-500 dark:border-ink-700 dark:text-ink-400">
              "{result.differences.transcribe}"
            </p>
            <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-slate-700 dark:text-ink-100">
              {result.differences.feedback}
            </p>

            {/* The diagnosis. Expected vs heard IPA per word is what
                actually tells a learner which sound went wrong - a single
                "sound accuracy 83%" says nothing they can act on. */}
            {result.word_detail?.length ? (
              <div className="mt-5">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-400 dark:text-ink-400">
                  Sound by sound
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {result.word_detail.map((w, i) => (
                    <span
                      key={`${w.word}-${i}`}
                      title={w.ok ? "Matched" : `Expected /${w.expected}/ — heard /${w.heard || "nothing"}/`}
                      className={`rounded-lg border px-2.5 py-1.5 text-[12px] ${
                        w.ok
                          ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400"
                          : "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
                      }`}
                    >
                      <span className="font-bold">{w.word}</span>
                      <span className="ml-1.5 font-mono text-[11px] opacity-80">
                        /{w.expected || "—"}/
                      </span>
                      {!w.ok ? (
                        <span className="ml-1 font-mono text-[11px]">→ /{w.heard || "nothing"}/</span>
                      ) : null}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
