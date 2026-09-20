import { client } from "./client";
import type { AuthResponse, LoginResult, User } from "../types";

export const authApi = {
  register: (email: string, name: string, password: string): Promise<AuthResponse> =>
    client.post("/auth/register", { email, name, password }).then((r) => r.data),

  login: (email: string, password: string): Promise<LoginResult> =>
    client.post("/auth/login", { email, password }).then((r) => r.data),

  // Step two of login when the first step returns totp_required - trades
  // the short-lived pending token plus a 6-digit code for a real session.
  verifyTotp: (totpPendingToken: string, code: string): Promise<AuthResponse> =>
    client.post("/auth/login/totp", { totp_pending_token: totpPendingToken, code }).then((r) => r.data),

  me: (): Promise<User> => client.get("/auth/me").then((r) => r.data),
};
