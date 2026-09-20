import { client } from "./client";
import type { Achievement, ProgressResponse } from "../types";

export const progressApi = {
  summary: (userId = "web-user"): Promise<ProgressResponse> =>
    client.get("/progress", { params: { user_id: userId } }).then((r) => r.data),

  achievements: (userId = "web-user"): Promise<Achievement[]> =>
    client.get("/achievements", { params: { user_id: userId } }).then((r) => r.data.achievements),
};
