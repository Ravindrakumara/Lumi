import { client } from "./client";

export interface ChatSessionSummary {
  id: string;
  title: string;
  preview: string;
  message_count: number;
  started_at: string | null;
  last_message_at: string | null;
}

export const chatApi = {
  // lessonId scopes the mentor's RAG retrieval to only that lesson's
  // uploaded material (see PGVectorRetriever.retrieve()) - omit it for
  // the general Chat page, pass it from LessonWorkbenchPage's in-lesson
  // chat widget.
  // No agent_name: the backend picks the mentor from the learner's
  // program and pitches it with their assessed CEFR band. Sending one
  // here would override that, which is why the selector is gone.
  sessions: (): Promise<ChatSessionSummary[]> =>
    client.get("/chat/sessions").then((r) => r.data.sessions),

  sessionMessages: (sessionId: string): Promise<{ role: "user" | "assistant"; content: string }[]> =>
    client.get(`/chat/sessions/${sessionId}`).then((r) => r.data.messages),

  deleteSession: (sessionId: string): Promise<void> =>
    client.delete(`/chat/sessions/${sessionId}`).then(() => undefined),

  send: (message: string, sessionId = "default", lessonId?: string): Promise<string> =>
    client
      .post("/chat", { message, session_id: sessionId, lesson_id: lessonId })
      .then((r) => r.data.response),
};
