import { client } from "./client";
import type { Voice, VoiceMode } from "../types";

export const voiceApi = {
  listVoices: (): Promise<Voice[]> => client.get("/voices").then((r) => r.data.voices),

  // Returns a Blob (audio/mpeg or audio/wav) - see web/server.py's
  // /api/tts, which tries the online neural voice first and falls back
  // to the offline pyttsx3 engine on any failure when mode="auto".
  synthesize: (text: string, voice: string, mode: VoiceMode): Promise<Blob> =>
    client
      .post("/tts", { text, voice, mode }, { responseType: "blob" })
      .then((r) => r.data),
};
