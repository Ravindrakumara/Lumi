import type { AdminRole } from "../types";

export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  root_admin: "Root Admin",
  manager: "Manager",
  receptionist: "Receptionist",
  it_admin: "IT Admin",
};

export const ADMIN_ROLE_OPTIONS = (Object.keys(ADMIN_ROLE_LABELS) as AdminRole[]).map((value) => ({
  value,
  label: ADMIN_ROLE_LABELS[value],
}));

// Which admin panel pages each role can reach - a UI-only convenience for
// hiding nav items/redirecting; the actual enforcement is server-side
// (require_admin_role in web/auth_routes.py, applied per-route). Keep in
// sync with that file's call sites if a page's backing route changes.
export type AdminPageKey = "dashboard" | "content" | "users" | "lessons" | "analytics" | "security" | "accounts";

export const ROLE_PAGES: Record<AdminRole, AdminPageKey[]> = {
  root_admin: ["dashboard", "content", "users", "lessons", "analytics", "security", "accounts"],
  it_admin: ["dashboard", "content", "lessons", "security"],
  manager: ["analytics", "security"],
  receptionist: ["users", "security"],
};

export function canAccessPage(role: AdminRole | null | undefined, page: AdminPageKey): boolean {
  if (!role) return false;
  return ROLE_PAGES[role].includes(page);
}
