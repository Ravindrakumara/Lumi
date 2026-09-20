import { client } from "./client";

export const accountApi = {
  // Schedules deletion after a grace period - does not delete immediately.
  // Logging back in before then cancels it automatically (see
  // web/auth_routes.py's DELETE /api/auth/account).
  scheduleDeletion: (): Promise<{ deletion_scheduled_at: string }> =>
    client.delete("/auth/account").then((r) => r.data),
};
