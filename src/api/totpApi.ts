import { client } from "./client";
import type { TotpSetupResponse } from "../types";

export const totpApi = {
  status: (): Promise<{ enabled: boolean }> => client.get("/admin/totp/status").then((r) => r.data),

  // Generates (or regenerates) a secret - never enabled until /enable
  // confirms the user can actually produce a valid code from it.
  setup: (): Promise<TotpSetupResponse> => client.post("/admin/totp/setup").then((r) => r.data),

  enable: (code: string): Promise<{ enabled: boolean }> =>
    client.post("/admin/totp/enable", { code }).then((r) => r.data),

  disable: (code: string): Promise<{ enabled: boolean }> =>
    client.post("/admin/totp/disable", { code }).then((r) => r.data),
};
