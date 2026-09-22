import { client } from "./client";
import type { AcousticFeatures } from "../types";

const MIME_EXTENSIONS: Record<string, string> = {
  "audio/webm": "webm",
  "audio/ogg": "ogg",
  "audio/mp4": "mp4",
  "audio/wav": "wav",
};

export interface TranscribeResult {
  text: string;
  acousticFeatures?: AcousticFeatures;
}

export const speechApi = {
  // Offline transcription via server-side Vosk - see web/speech_routes.py.
  // Exists because the browser's own Web Speech API needs Chrome's
  // embedded Google API key for its cloud recognition service, which
  // open-source Chromium builds don't have, so it always fails with a
  // "network" error regardless of real connectivity.
  transcribe: (blob: Blob, mimeType: string): Promise<string> => {
    const ext = MIME_EXTENSIONS[mimeType.split(";")[0]] || "webm";
    const formData = new FormData();
    formData.append("file", blob, `speech.${ext}`);
    return client
      .post("/speech-to-text", formData, { headers: { "Content-Type": "multipart/form-data" } })
      .then((r) => r.data.text as string);
  },

  // Same endpoint, opted into the extra pitch/pace/pause measurement
  // (infrastructure/voice/acoustic_features.py) - only the assessment
  // page needs this (US-02's AC-6), so it's a separate method rather
  // than a flag every existing transcribe() caller would have to
  // remember to pass false.
  transcribeWithAcousticFeatures: (blob: Blob, mimeType: string): Promise<TranscribeResult> => {
    const ext = MIME_EXTENSIONS[mimeType.split(";")[0]] || "webm";
    const formData = new FormData();
    formData.append("file", blob, `speech.${ext}`);
    return client
      .post("/speech-to-text?include_acoustic_features=true", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => ({ text: r.data.text as string, acousticFeatures: r.data.acoustic_features }));
  },
};
