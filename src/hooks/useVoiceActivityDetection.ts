import { useCallback, useRef } from "react";

interface VadOptions {
  /** Called once the user has spoken and then gone quiet for
   * `silenceDurationMs` - the "they've finished this turn" signal. */
  onSilenceAfterSpeech: () => void;
  /** RMS amplitude (0-128ish) above which audio counts as "speech" rather
   * than background noise. Mic gain and ambient noise vary a lot across
   * machines/browsers - this is a reasonable default, not a measured
   * constant, so it may need retuning if it's too twitchy or too deaf. */
  speechThreshold?: number;
  /** How long the signal must stay below the threshold, after speech was
   * heard, before it counts as "done talking" rather than a mid-sentence
   * pause. */
  silenceDurationMs?: number;
  /** Ignore speech blips shorter than this (a cough, a click) so they
   * don't immediately arm the silence timer. */
  minSpeechDurationMs?: number;
  /** Fired every animation frame with loudness normalised to 0-1, for
   * driving audio-reactive visuals (the orb). The RMS is measured here
   * regardless; this just stops throwing it away. Deliberately a callback
   * rather than React state - at 60fps setState would re-render the whole
   * chat tree every frame. */
  onLevel?: (level: number) => void;
}

/** RMS value treated as "full scale" for the 0-1 level. Normal speech sits
 * well under this; it's picked so an ordinary talking voice uses most of
 * the range without constantly clipping at 1. */
const LEVEL_FULL_SCALE = 45;

/** Detects "the user has stopped talking" from a live MediaStream via the
 * Web Audio API, so a voice conversation loop knows when to stop
 * recording without the user manually clicking stop. Runs alongside a
 * MediaRecorder on the same stream (Web Audio API and MediaRecorder can
 * both read one MediaStream independently, no conflict). */
export function useVoiceActivityDetection() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const rafRef = useRef<number | null>(null);

  const stop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    sourceRef.current?.disconnect();
    analyserRef.current?.disconnect();
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(() => {});
    }
    audioContextRef.current = null;
    analyserRef.current = null;
    sourceRef.current = null;
  }, []);

  const start = useCallback(
    (stream: MediaStream, options: VadOptions) => {
      const {
        onSilenceAfterSpeech,
        speechThreshold = 12,
        silenceDurationMs = 1400,
        minSpeechDurationMs = 250,
        onLevel,
      } = options;

      stop();

      const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextCtor) return;

      const audioContext = new AudioContextCtor();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      sourceRef.current = source;

      const data = new Uint8Array(analyser.frequencyBinCount);
      let hasSpoken = false;
      let speechStartedAt = 0;
      let silenceStartedAt: number | null = null;

      const tick = () => {
        analyser.getByteTimeDomainData(data);

        let sumSquares = 0;
        for (let i = 0; i < data.length; i++) {
          const centered = data[i] - 128;
          sumSquares += centered * centered;
        }
        const rms = Math.sqrt(sumSquares / data.length);
        const now = performance.now();

        onLevel?.(Math.min(1, rms / LEVEL_FULL_SCALE));

        if (rms > speechThreshold) {
          if (!hasSpoken) {
            hasSpoken = true;
            speechStartedAt = now;
          }
          silenceStartedAt = null;
        } else if (hasSpoken && now - speechStartedAt > minSpeechDurationMs) {
          if (silenceStartedAt === null) {
            silenceStartedAt = now;
          } else if (now - silenceStartedAt > silenceDurationMs) {
            stop();
            onLevel?.(0);
            onSilenceAfterSpeech();
            return;
          }
        }

        rafRef.current = requestAnimationFrame(tick);
      };

      rafRef.current = requestAnimationFrame(tick);
    },
    [stop]
  );

  return { start, stop };
}
