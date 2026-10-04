import { client } from "./client";
import type { LessonLevel } from "../types";

// What GET /api/admin/lessons returns. Deliberately its own type rather
// than the learner-facing LessonSummary: the two endpoints return genuinely
// different shapes - the admin list carries `introduction` and no lock or
// progress fields, because an editor has no progress and nothing is locked
// to them.
export interface AdminLessonSummary {
  id: string;
  level: LessonLevel;
  title: string;
  description: string;
  introduction: string;
  topic: string;
  cefr_level: string | null;
  sequence: number | null;
  difficulty: number;
  duration_minutes: number;
  exercise_count: number;
  max_score: number;
}

export interface LessonMaterialDocument {
  id: number;
  source: string;
  title: string;
  created_at: string;
}

export interface CreateLessonRequest {
  id: string;
  level: LessonLevel;
  title: string;
  description: string;
  topic: string;
  difficulty: number;
  duration_minutes: number;
  introduction?: string;
  // "" clears the tag and reopens the lesson to everyone.
  cefr_level?: string | null;
  // Curriculum position. Blank leaves the lesson out of the running order.
  sequence?: number | string | null;
}

export type UpdateLessonRequest = Partial<Omit<CreateLessonRequest, "id">>;

export const adminLessonsApi = {
  list: (): Promise<AdminLessonSummary[]> => client.get("/admin/lessons").then((r) => r.data.lessons),

  create: (body: CreateLessonRequest): Promise<AdminLessonSummary> =>
    client.post("/admin/lessons", body).then((r) => r.data),

  update: (lessonId: string, body: UpdateLessonRequest): Promise<AdminLessonSummary> =>
    client.put(`/admin/lessons/${lessonId}`, body).then((r) => r.data),

  remove: (lessonId: string): Promise<void> => client.delete(`/admin/lessons/${lessonId}`).then(() => undefined),

  listMaterial: (lessonId: string): Promise<LessonMaterialDocument[]> =>
    client.get(`/admin/lessons/${lessonId}/material`).then((r) => r.data.documents),

  uploadMaterial: (lessonId: string, file: File): Promise<{ saved: string; indexed_chunks: number }> => {
    const formData = new FormData();
    formData.append("file", file);
    return client
      .post(`/admin/lessons/${lessonId}/material`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },

  deleteMaterial: (lessonId: string, documentId: number): Promise<void> =>
    client.delete(`/admin/lessons/${lessonId}/material/${documentId}`).then(() => undefined),
};
