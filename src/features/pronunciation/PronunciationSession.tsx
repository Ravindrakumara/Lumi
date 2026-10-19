import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { analysisApi, type SessionPart } from "../../api/analysisApi";
import Orb from "../../components/atoms/Orb";
import Spinner from "../../components/atoms/Spinner";
import { useAudioRecorder } from "../../hooks/useAudioRecorder";
import type { PronunciationResult } from "../../types";

const MIME_EXTENSIONS: Record<string, string> = {
  "audio/webm": "webm",
  "audio/ogg": "ogg",
  "audio/mp4": "m4a",
  "audio/wav": "wav",
};

/** What the learner records for a given part. Part 1 is the odd one out:
 * minimal pairs have to be recorded one word at a time, because the whole
 * point is to hear which of two sounds actually came out. Recording both
 * words in one take would leave the engine scoring a phrase. */
function promptsFor(part: SessionPart): string[] {
  if (part.part === 1) return (part.minimal_pairs ?? []).flat();
  if (part.part === 2) return part.twister ? [part.twister] : [];
  if (part.part === 3) return part.sentence ? [part.sentence] : [];
  return part.model_line ? [part.model_line] : [];
}

function Stepper({
  parts,
  current,
  onPick,
}: {
  parts: SessionPart[];
  current: number;
  onPick: (part: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {parts.map((p) => {
        const active = p.part === current;
        return (
          <button
            key={p.part}
            type="button"
            disabled={!p.available}
            onClick={() => onPick(p.part)}
            // Locked parts stay visible rather than hidden: the learner
            // should see what the ladder holds, not be shown a shorter
            // product than exists.
            title={p.available ? p.instruction : "Unlocks at a higher level"}
            className={`rounded-full border px-3.5 py-1.5 text-[12px] font-bold transition-colors disabled:cursor-not-allowed ${
              active
                ? "border-brand-500 bg-brand-500 text-white"
                : p.available
                  ? "border-slate-200 bg-white text-slate-600 hover:border-brand-200 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-300"
                  : "border-slate-200 bg-slate-50 text-slate-300 dark:border-ink-800 dark:bg-ink-900 dark:text-ink-700"
            }`}
          >
            {p.part}. {p.name}
            {!p.available ? " 🔒" : ""}
          </button>
        );
      })}
    </div>
  );
}

export default function PronunciationSession() {
  const [partNumber, setPartNumber] = useState(1);
  const [promptIndex, setPromptIndex] = useState(0);
  const [result, setResult] = useState<PronunciationResult | null>(null);
  const [recordingError, setRecordingError] = useState("");
  const advanceRef = useRef(false);

  const { data: session, isLoading, refetch } = useQuery({
    queryKey: ["pronunciation", "session"],
    queryFn: () => analysisApi.pronunciationSession(),
  });

  const { isRecording, levelRef, start, stop, isSupported } = useAudioRecorder({
    onError: setRecordingError,
  });

  const part = session?.parts.find((p) => p.part === partNumber);
  const prompts = part ? promptsFor(part) : [];
  const prompt = prompts[promptIndex] ?? "";

  // Opening on a locked part would show an empty screen with no way to
  // act, so settle on the first part this band actually reaches.
  useEffect(() => {
    if (session && !session.available_parts.includes(partNumber)) {
      setPartNumber(session.available_parts[0] ?? 1);
    }
  }, [session, partNumber]);

  const analyze = useMutation({
    mutationFn: ({ blob, mimeType }: { blob: Blob; mimeType: string }) => {
      const ext = MIME_EXTENSIONS[mimeType.split(";")[0]] || "webm";
      return analysisApi.analyzePronunciation(blob, `take.${ext}`, prompt, partNumber);
    },
    onSuccess: (data) => {
      setResult(data);
      // A pass moves the learner on; a miss leaves them on the same
      // prompt to try again, which is the point of a drill.
      advanceRef.current = Boolean(data.part_result?.passed);
      void refetch();
    },
  });

  async function handleTap() {
    if (analyze.isPending || !prompt) return;
    if (!isRecording) {
      setRecordingError("");
      setResult(null);
      analyze.reset();
      start();
      return;
    }
    const take = await stop();
    if (take) analyze.mutate(take);
  }

  function nextPrompt() {
    setResult(null);
    analyze.reset();
    if (promptIndex + 1 < prompts.length) {
      setPromptIndex(promptIndex + 1);
      return;
    }
    // End of this part - move to the next one this band reaches.
    const available = session?.available_parts ?? [1];
    const next = available[available.indexOf(partNumber) + 1];
    setPromptIndex(0);
    if (next) setPartNumber(next);
  }

  if (isLoading || !session || !part) return <Spinner />;

  const passed = result?.part_result?.passed;
  const accuracy = result?.part_result?.phoneme_accuracy;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      {/* Which sound, why it was chosen, and how close it is to being
          retired - so the learner knows why this keeps coming back. */}
      <div className="rounded-[18px] border border-slate-200 bg-white px-5 py-4 dark:border-ink-700 dark:bg-ink-900">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <p className="font-display text-[19px] font-extrabold text-ink-900 dark:text-ink-100">
              Working on {session.label}
            </p>
            <p className="mt-0.5 text-[12.5px] text-slate-500 dark:text-ink-400">
              Often confused with {session.confused_with} · chosen because {session.chosen_from}
            </p>
          </div>
          <span className="text-[12px] font-bold text-brand-600 dark:text-live-500">
            {session.mastery.mastered
              ? "Mastered ✓"
              : `${session.mastery.streak}/${session.mastery.needed} clean in a row`}
          </span>
        </div>
        <div className="mt-3">
          <Stepper parts={session.parts} current={partNumber} onPick={(n) => { setPartNumber(n); setPromptIndex(0); setResult(null); }} />
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 py-2 text-center">
        <p className="text-[12.5px] text-slate-500 dark:text-ink-400">{part.instruction}</p>
        {part.how ? (
          <p className="max-w-md text-[12.5px] font-medium text-brand-600 dark:text-live-500">{part.how}</p>
        ) : null}

        <p className="font-display text-[22px] font-extrabold text-ink-900 dark:text-ink-100">{prompt}</p>

        {/* The stress markers and the model line are teaching aids. The
            engine scores neither, and the UI says so rather than implying
            a measurement that does not exist. */}
        {part.part === 3 && part.stress_hint ? (
          <p className="text-[13px] font-semibold tracking-wide text-slate-500 dark:text-ink-400">
            {part.stress_hint}
            <span className="ml-2 font-normal italic opacity-70">(stress is not scored)</span>
          </p>
        ) : null}
        {part.part === 4 && part.note ? (
          <p className="max-w-md text-[12px] italic text-slate-500 dark:text-ink-400">{part.note}</p>
        ) : null}

        {prompts.length > 1 ? (
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400 dark:text-ink-400">
            {promptIndex + 1} of {prompts.length} · about {part.record_seconds}s
          </p>
        ) : null}

        {isSupported ? (
          <button type="button" onClick={handleTap} disabled={analyze.isPending} className="orb-btn">
            <Orb
              size={120}
              state={isRecording ? "listening" : analyze.isPending ? "thinking" : "idle"}
              levelRef={levelRef}
              label={isRecording ? "Tap to stop" : "Tap to speak"}
            />
          </button>
        ) : (
          <p className="text-sm text-red-600">Recording is not supported in this browser.</p>
        )}

        <p className="text-[12.5px] font-semibold text-slate-500 dark:text-ink-400">
          {isRecording ? "Listening…" : analyze.isPending ? "Scoring…" : "Tap the orb, then say it"}
        </p>
        {recordingError ? <p className="text-xs text-red-600">{recordingError}</p> : null}
      </div>

      {result ? (
        <div
          className={`rounded-[18px] border p-5 ${
            passed
              ? "border-emerald-300 bg-emerald-50/60 dark:border-emerald-500/30 dark:bg-emerald-500/10"
              : "border-amber-300 bg-amber-50/60 dark:border-amber-500/30 dark:bg-amber-500/10"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-display text-[17px] font-extrabold text-ink-900 dark:text-ink-100">
              {passed ? "Clean ✓" : "Not yet"}
              {accuracy != null ? (
                <span className="ml-2 text-[13px] font-semibold text-slate-500 dark:text-ink-400">
                  {Math.round(accuracy * 100)}% sound accuracy (pass is{" "}
                  {Math.round((result.part_result?.threshold ?? 0.8) * 100)}%)
                </span>
              ) : null}
            </p>
            <button
              type="button"
              onClick={nextPrompt}
              className="rounded-full bg-brand-500 px-5 py-2 text-[12.5px] font-bold text-white hover:bg-brand-600"
            >
              {promptIndex + 1 < prompts.length ? "Next →" : "Next part →"}
            </button>
          </div>

          <p className="mt-3 whitespace-pre-line text-[13.5px] leading-relaxed text-slate-700 dark:text-ink-100">
            {result.differences.feedback}
          </p>

          {result.word_detail?.length ? (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {result.word_detail.map((w, i) => (
                <span
                  key={`${w.word}-${i}`}
                  className={`rounded-lg border px-2.5 py-1 text-[12px] ${
                    w.ok
                      ? "border-emerald-200 bg-white text-emerald-800 dark:border-emerald-500/30 dark:bg-ink-900 dark:text-emerald-400"
                      : "border-amber-300 bg-white text-amber-900 dark:border-amber-500/30 dark:bg-ink-900 dark:text-amber-300"
                  }`}
                >
                  <span className="font-bold">{w.word}</span>
                  <span className="ml-1.5 font-mono text-[11px] opacity-80">/{w.expected || "—"}/</span>
                  {!w.ok ? <span className="ml-1 font-mono text-[11px]">→ /{w.heard || "nothing"}/</span> : null}
                </span>
              ))}
            </div>
          ) : null}

          {/* Naming what nobody measured is as important as the score. */}
          {result.part_result?.not_measured?.length ? (
            <p className="mt-3 text-[11.5px] italic text-slate-500 dark:text-ink-400">
              Not measured here: {result.part_result.not_measured.join(", ")}.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
