import { client } from "./client";
import type { LoginResult } from "../types";

export interface OAuthProviderInfo {
  enabled: boolean;
  client_id: string | null;
}

export interface OAuthProvidersResponse {
  google: OAuthProviderInfo;
  microsoft: OAuthProviderInfo;
  yahoo: OAuthProviderInfo;
}

export const oauthApi = {
  listProviders: (): Promise<OAuthProvidersResponse> =>
    client.get("/auth/oauth/providers").then((r) => r.data),

  loginWithGoogle: (credential: string): Promise<LoginResult> =>
    client.post("/auth/oauth/google", { credential }).then((r) => r.data),
};
