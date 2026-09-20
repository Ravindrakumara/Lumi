import { client } from "./client";
import type { RagDocumentsResponse, RagUploadResponse, User } from "../types";

export const adminApi = {
  listUsers: (): Promise<User[]> => client.get("/admin/users").then((r) => r.data.users),

  listRagDocuments: (): Promise<RagDocumentsResponse> =>
    client.get("/admin/rag/documents").then((r) => r.data),

  uploadRagDocument: (file: File): Promise<RagUploadResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    return client
      .post("/admin/rag/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },
};
