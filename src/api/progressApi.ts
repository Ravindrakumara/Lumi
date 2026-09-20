import { client } from "./client";
import type { Achievement, ProgressResponse } from "../types";

export const progressApi = {
  // The backend derives the real user from the Authorization header, not
  // a client-sent user_id (see lessonsApi.ts's start/submit comment).
  summary: (): Promise<ProgressResponse> =>
    client.get("/progress").then((r) => r.data),

  achievements: (): Promise<Achievement[]> =>
    client.get("/achievements").then((r) => r.data.achievements),
};
