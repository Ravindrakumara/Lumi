import { client } from "./client";
import type { Exercise, ExerciseResult, LessonDetail, LessonProgress, LessonSummary, VocabularyWord } from "../types";

export interface StartLessonResponse {
  progress: LessonProgress;
  exercise: Exercise | null;
}

export interface SubmitExerciseResponse {
  result: ExerciseResult;
  progress: LessonProgress;
  next_exercise: Exercise | null;
}

export const lessonsApi = {
  list: (level = ""): Promise<LessonSummary[]> =>
    client.get("/lessons", { params: level ? { level } : {} }).then((r) => r.data.lessons),

  detail: (lessonId: string): Promise<LessonDetail> =>
    client.get(`/lessons/${lessonId}`).then((r) => r.data.lesson),

  // The backend derives the real user from the Authorization header (see
  // web/server.py's get_current_claims) - it used to trust a client-sent
  // user_id here, which every caller left at its "web-user" default, so
  // every learner was silently sharing one global progress record.
  start: (lessonId: string): Promise<StartLessonResponse> =>
    client.post(`/lessons/${lessonId}/start`).then((r) => r.data),

  submit: (
    lessonId: string,
    exerciseId: string,
    answer: string
  ): Promise<SubmitExerciseResponse> =>
    client
      .post(`/lessons/${lessonId}/submit`, { exercise_id: exerciseId, answer })
      .then((r) => r.data),

  vocabulary: (level = ""): Promise<VocabularyWord[]> =>
    client.get("/vocabulary", { params: level ? { level } : {} }).then((r) => r.data.vocabulary),
};
