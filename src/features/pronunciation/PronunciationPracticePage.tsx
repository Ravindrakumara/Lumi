import { useMutation } from "@tanstack/react-query";
import { MicrophoneIcon, StopIcon } from "@heroicons/react/24/solid";
import { useEffect, useRef, useState } from "react";
import { analysisApi } from "../../api/analysisApi";
import Badge from "../../components/atoms/Badge";
import Button from "../../components/atoms/Button";
import Card from "../../components/atoms/Card";
import Select from "../../components/atoms/Select";
import Spinner from "../../components/atoms/Spinner";
import StatTile from "../../components/atoms/StatTile";
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

export default function PronunciationPracticePage() {
  const [expectedText, setExpectedText] = useState(PRACTICE_SENTENCES[0]);
  const [recordingError, setRecordingError] = useState("");
  const [recordedAudio, setRecordedAudio] = useState<{ blob: Blob; mimeType: string } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { isRecording, start, stop, isSupported } = useAudioRecorder({ onError: setRecordingError });

  const analyzeMutation = useMutation({
    mutationFn: () => {
      if (!recordedAudio) throw new Error("No recording to analyze.");
      const ext = MIME_EXTENSIONS[recordedAudio.mimeType.split(";")[0]] || "webm";
      return analysisApi.analyzePronunciation(recordedAudio.blob, `recording.${ext}`, expectedText);
    },
  });

  const elapsed = useElapsedSeconds(analyzeMutation.isPending);

  async function handleStopRecording() {
    const result = await stop();
    if (result) {
      setRecordedAudio(result);
      setPreviewUrl(URL.createObjectURL(result.blob));
    }
  }

  const result = analyzeMutation.data as PronunciationResult | undefined;

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-ink-100">Pronunciation Practice</h2>
        <p className="text-sm text-slate-500 dark:text-ink-400">
          Real acoustic pronunciation scoring - phoneme-level, not a language model's guess.
        </p>
      </div>

      <Card>
        <Select
          label="Sentence to practice"
          value={expectedText}
          onChange={setExpectedText}
          options={PRACTICE_SENTENCES.map((s) => ({ value: s, label: s }))}
        />

        <div className="mt-4 flex items-center gap-3">
          {isSupported ? (
            <Button
              type="button"
              variant={isRecording ? "danger" : "primary"}
              onClick={() => (isRecording ? handleStopRecording() : start())}
            >
              {isRecording ? <StopIcon className="h-4 w-4" /> : <MicrophoneIcon className="h-4 w-4" />}
              {isRecording ? "Stop recording" : "Start recording"}
            </Button>
          ) : (
            <p className="text-sm text-red-600">Microphone recording is not supported in this browser.</p>
          )}

          {previewUrl ? <audio controls src={previewUrl} className="h-9" /> : null}
        </div>

        {recordingError ? <p className="mt-2 text-sm text-red-600">{recordingError}</p> : null}

        {recordedAudio ? (
          <Button
            className="mt-4"
            onClick={() => analyzeMutation.mutate()}
            loading={analyzeMutation.isPending}
            disabled={analyzeMutation.isPending}
          >
            Analyze pronunciation
          </Button>
        ) : null}
      </Card>

      {analyzeMutation.isPending ? (
        <Card className="flex items-center gap-3">
          <Spinner size={24} />
          <div>
            <p className="text-sm font-medium text-slate-800 dark:text-ink-100">
              Analyzing your pronunciation — {elapsed}s elapsed
            </p>
            <p className="text-xs text-slate-500 dark:text-ink-400">
              This runs real acoustic analysis on our server and can genuinely take a few minutes.
              Please don't close this page.
            </p>
          </div>
        </Card>
      ) : null}

      {analyzeMutation.isError ? (
        <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
          Analysis failed. Please try again.
        </p>
      ) : null}

      {result ? (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <StatTile
              value={`${result.score.toFixed(0)}`}
              label="Score"
              tone={result.score >= 70 ? "success" : result.score >= 40 ? "warning" : "neutral"}
              percent={result.score}
            />
            <StatTile
              value={`${(result.differences.word_error_rate * 100).toFixed(0)}%`}
              label="Word error rate"
              tone="info"
            />
            <StatTile
              value={`${(result.differences.phoneme_error_rate * 100).toFixed(0)}%`}
              label="Phoneme error rate"
              tone="highlight"
            />
          </div>

          <Card>
            <p className="mb-2 whitespace-pre-line text-sm text-slate-700 dark:text-ink-100">
              {result.differences.feedback}
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-ink-400">
              <Badge tone="brand">Heard</Badge>
              <span>{result.differences.transcribe}</span>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
