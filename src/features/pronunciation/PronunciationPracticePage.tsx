import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { analysisApi } from "../../api/analysisApi";
import Orb from "../../components/atoms/Orb";
import PageHeader from "../../components/atoms/PageHeader";
import Select from "../../components/atoms/Select";
import { useAudioRecorder } from "../../hooks/useAudioRecorder";
import type { PronunciationResult } from "../../types";

const PRACTICE_SENTENCES = [
  "Hello, how are you today?",
  "I would like to improve my English speaking.",
  "The weather is beautiful this morning.",
  "Can you help me with this exercise?",
  "Practice makes perfect.",
];

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
  const [expectedText, setExpectedText] = useState(PRACTICE_SENTENCES[0]);
  const [recordingError, setRecordingError] = useState("");
  const [changingSentence, setChangingSentence] = useState(false);
  // Hearing your own attempt back is most of the value of pronunciation
  // practice - the score alone doesn't tell you what you actually said.
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);

  const { isRecording, start, stop, isSupported } = useAudioRecorder({ onError: setRecordingError });

  const analyzeMutation = useMutation({
    mutationFn: ({ blob, mimeType }: { blob: Blob; mimeType: string }) => {
      const ext = MIME_EXTENSIONS[mimeType.split(";")[0]] || "webm";
      return analysisApi.analyzePronunciation(blob, `recording.${ext}`, expectedText);
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

      <div className="flex flex-col items-center gap-5 overflow-hidden rounded-[24px] border border-[#16224a] bg-[radial-gradient(ellipse_80%_60%_at_50%_26%,#16255c,#050a1c_70%)] px-6 py-8">
        <div className="w-full max-w-md text-center">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#6b7ea8]">Sentence to practice</p>
          {changingSentence ? (
            <div className="mt-2 text-left">
              <Select
                value={expectedText}
                onChange={(value) => {
                  setExpectedText(value);
                  setChangingSentence(false);
                  analyzeMutation.reset();
                }}
                options={PRACTICE_SENTENCES.map((s) => ({ value: s, label: s }))}
              />
            </div>
          ) : (
            <>
              <p className="mt-1.5 font-display text-[19px] font-extrabold text-white">{expectedText}</p>
              <button
                type="button"
                onClick={() => setChangingSentence(true)}
                disabled={isRecording || analyzeMutation.isPending}
                className="mt-1.5 text-[11.5px] font-semibold text-[#7fa2e8] hover:underline disabled:opacity-40"
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
            <Orb size={132} state={orbState} label={status} />
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

      {result ? (
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
          </div>
        </div>
      ) : null}
    </div>
  );
}
