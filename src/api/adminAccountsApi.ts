import { client } from "./client";
import type { AdminRole, User } from "../types";

export interface CreateAdminAccountRequest {
  email: string;
  name: string;
  password: string;
  admin_role: AdminRole;
}

export const adminAccountsApi = {
  list: (): Promise<User[]> => client.get("/admin/accounts").then((r) => r.data.accounts),

  create: (body: CreateAdminAccountRequest): Promise<User> =>
    client.post("/admin/accounts", body).then((r) => r.data),

  // admin_role: null revokes admin access entirely.
  updateRole: (userId: string, adminRole: AdminRole | null): Promise<User> =>
    client.put(`/admin/accounts/${userId}`, { admin_role: adminRole }).then((r) => r.data),
};
