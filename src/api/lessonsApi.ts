import { client } from "./client";
import type { Exercise, ExerciseResult, LessonDetail, LessonProgress, LessonSummary, VocabularyWord } from "../types";

export interface StartLessonResponse {
  progress: LessonProgress;
  exercise: Exercise | null;
}

export interface NextLesson {
  id: string;
  title: string;
  description: string;
  cefr_level: string | null;
  topic: string;
  exercise_count: number;
  duration_minutes: number;
}

export interface SubmitExerciseResponse {
  result: ExerciseResult;
  progress: LessonProgress;
  next_exercise: Exercise | null;
  // Present only once this lesson is finished: the next unlocked lesson in
  // curriculum order, so the learner continues from here instead of going
  // back to the catalogue to find their place.
  next_lesson: NextLesson | null;
}

export const lessonsApi = {
  // Browsed by CEFR band, not by program: the learner is placed on a
  // band by the assessment, and that is what the lessons are tagged with.
  list: (cefr = ""): Promise<LessonSummary[]> =>
    client.get("/lessons", { params: cefr ? { cefr } : {} }).then((r) => r.data.lessons),

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
