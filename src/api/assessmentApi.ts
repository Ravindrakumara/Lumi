import { client } from "./client";
import type { AcousticFeatures, AssessmentRespondResponse, AssessmentResult, AssessmentSessionState } from "../types";

export const assessmentApi = {
  start: (): Promise<AssessmentSessionState> => client.post("/assessment/start").then((r) => r.data),

  rerun: (): Promise<AssessmentSessionState> => client.post("/assessment/rerun").then((r) => r.data),

  latest: (): Promise<AssessmentResult | null> =>
    client.get("/assessment/latest").then((r) => r.data.result),

  // acoustic_features (AC-6) is only present on a voice-answered turn -
  // omitted entirely for typed turns, same as the backend's own
  // Optional[Dict] default of None (see domain/models/assessment.py).
  respond: (sessionId: string, message: string, acousticFeatures?: AcousticFeatures): Promise<AssessmentRespondResponse> =>
    client
      .post(`/assessment/${sessionId}/respond`, {
        message,
        ...(acousticFeatures ? { acoustic_features: acousticFeatures } : {}),
      })
      .then((r) => r.data),
};
