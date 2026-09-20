import { client } from "./client";
import type { LessonLevel, LessonSummary } from "../types";

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
}

export type UpdateLessonRequest = Partial<Omit<CreateLessonRequest, "id">>;

export const adminLessonsApi = {
  list: (): Promise<LessonSummary[]> => client.get("/admin/lessons").then((r) => r.data.lessons),

  create: (body: CreateLessonRequest): Promise<LessonSummary> =>
    client.post("/admin/lessons", body).then((r) => r.data),

  update: (lessonId: string, body: UpdateLessonRequest): Promise<LessonSummary> =>
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
