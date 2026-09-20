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

  start: (lessonId: string, userId = "web-user"): Promise<StartLessonResponse> =>
    client.post(`/lessons/${lessonId}/start`, { user_id: userId }).then((r) => r.data),

  submit: (
    lessonId: string,
    exerciseId: string,
    answer: string,
    userId = "web-user"
  ): Promise<SubmitExerciseResponse> =>
    client
      .post(`/lessons/${lessonId}/submit`, { user_id: userId, exercise_id: exerciseId, answer })
      .then((r) => r.data),

  vocabulary: (level = ""): Promise<VocabularyWord[]> =>
    client.get("/vocabulary", { params: level ? { level } : {} }).then((r) => r.data.vocabulary),
};
