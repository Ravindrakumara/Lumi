import { client } from "./client";
import type { PronunciationResult } from "../types";

export const analysisApi = {
  // Real acoustic analysis (OpenPronounce, self-hosted), not the chat LLM -
  // see web/analysis_routes.py. Can take minutes on this server's CPU;
  // the caller is responsible for showing a real "this takes a while"
  // loading state, not a spinner that implies "any second now".
  analyzePronunciation: (audioBlob: Blob, filename: string, expectedText: string): Promise<PronunciationResult> => {
    const formData = new FormData();
    formData.append("file", audioBlob, filename);
    return client
      .post(`/analysis/pronunciation?expected_text=${encodeURIComponent(expectedText)}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 0, // no client-side timeout - this can genuinely take minutes
      })
      .then((r) => r.data);
  },
};
