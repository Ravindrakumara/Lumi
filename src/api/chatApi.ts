import { client } from "./client";

export const chatApi = {
  // lessonId scopes the mentor's RAG retrieval to only that lesson's
  // uploaded material (see PGVectorRetriever.retrieve()) - omit it for
  // the general Chat page, pass it from LessonWorkbenchPage's in-lesson
  // chat widget.
  send: (message: string, sessionId = "default", agentName = "", lessonId?: string): Promise<string> =>
    client
      .post("/chat", { message, session_id: sessionId, agent_name: agentName, lesson_id: lessonId })
      .then((r) => r.data.response),
};
