import { client } from "./client";

export interface PracticeSentence {
  text: string;
  /** What sound feature this sentence is for - shown to the learner so
   * they know what is being listened for, rather than guessing. */
  focus: string;
  cefr_level: string | null;
}
import type { PronunciationResult } from "../types";

export interface PronunciationHistory {
  attempts: {
    id: number;
    expected_text: string;
    transcribed_text: string;
    score: number;
    cefr_level: string | null;
    created_at: string;
  }[];
  attempt_count: number;
  average_score: number | null;
  best_score: number | null;
  trouble_words: { word: string; misses: number }[];
}

export interface SessionPart {
  part: 1 | 2 | 3 | 4;
  name: string;
  available: boolean;
  instruction: string;
  record_seconds: number;
  how?: string;
  minimal_pairs?: string[][];
  twister?: string;
  sentence?: string;
  stress_hint?: string;
  /** Always false today - the scorer does not evaluate stress, so the
   * markers are a teaching aid and no stress score may be shown. */
  stress_is_scored?: boolean;
  model_line?: string;
  /** Always false today - pitch analysis is not available. */
  intonation_is_scored?: boolean;
  note?: string;
}

export interface PronunciationSession {
  sound: string;
  label: string;
  confused_with: string;
  cefr_level: string | null;
  parts: SessionPart[];
  available_parts: number[];
  pass_threshold: number;
  chosen_from: string;
  mastery: { streak: number; needed: number; mastered: boolean };
  mastered_sounds: string[];
}

export const analysisApi = {
  // The four-part loop, built around whichever sound the learner's own
  // last attempt diagnosed - see domain/models/pronunciation_session.py.
  pronunciationSession: (target?: string): Promise<PronunciationSession> =>
    client
      .get("/analysis/pronunciation/session", { params: target ? { target } : {} })
      .then((r) => r.data),

  pronunciationSounds: (): Promise<{ sounds: { sound: string; label: string; confused_with: string }[] }> =>
    client.get("/analysis/pronunciation/sounds").then((r) => r.data),

  pronunciationHistory: (): Promise<PronunciationHistory> =>
    client.get("/analysis/pronunciation/history").then((r) => r.data),

  // Pitched at the learner's measured band - see domain/models/
  // pronunciation_bank.py for why the material differs per level.
  practiceSentences: (): Promise<{ cefr_level: string | null; sentences: PracticeSentence[] }> =>
    client.get("/pronunciation/sentences").then((r) => r.data),

  // Real acoustic analysis (OpenPronounce, self-hosted), not the chat LLM -
  // see web/analysis_routes.py. Can take minutes on this server's CPU;
  // the caller is responsible for showing a real "this takes a while"
  // loading state, not a spinner that implies "any second now".
  // `part` (1-4) tags the attempt with which step of the session it came
  // from, so the result can say what was and was not measured for it.
  analyzePronunciation: (
    audioBlob: Blob,
    filename: string,
    expectedText: string,
    part?: number
  ): Promise<PronunciationResult> => {
    const formData = new FormData();
    formData.append("file", audioBlob, filename);
    const query = new URLSearchParams({ expected_text: expectedText });
    if (part) query.set("part", String(part));
    return client
      .post(`/analysis/pronunciation?${query.toString()}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 0, // no client-side timeout - this can genuinely take minutes
      })
      .then((r) => r.data);
  },
};
