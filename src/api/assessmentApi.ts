import { client } from "./client";
import type { AssessmentRespondResponse, AssessmentResult, AssessmentSessionState } from "../types";

export const assessmentApi = {
  start: (): Promise<AssessmentSessionState> => client.post("/assessment/start").then((r) => r.data),

  rerun: (): Promise<AssessmentSessionState> => client.post("/assessment/rerun").then((r) => r.data),

  latest: (): Promise<AssessmentResult | null> =>
    client.get("/assessment/latest").then((r) => r.data.result),

  respond: (sessionId: string, message: string): Promise<AssessmentRespondResponse> =>
    client.post(`/assessment/${sessionId}/respond`, { message }).then((r) => r.data),
};
