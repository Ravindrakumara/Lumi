import { client } from "./client";

const MIME_EXTENSIONS: Record<string, string> = {
  "audio/webm": "webm",
  "audio/ogg": "ogg",
  "audio/mp4": "mp4",
  "audio/wav": "wav",
};

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
};
