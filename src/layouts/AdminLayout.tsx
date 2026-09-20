import {
  ChartPieIcon,
  DocumentTextIcon,
  IdentificationIcon,
  LockClosedIcon,
  PencilSquareIcon,
  ShieldCheckIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { Outlet } from "react-router-dom";
import Sidebar, { type NavItemConfig } from "../components/organisms/Sidebar";
import { canAccessPage, type AdminPageKey } from "../constants/adminRoles";
import { useAuthStore } from "../store/authStore";

const NAV_ITEMS: (NavItemConfig & { page: AdminPageKey })[] = [
  { to: "/admin", label: "Dashboard", icon: ShieldCheckIcon, page: "dashboard" },
  { to: "/admin/content", label: "RAG Content", icon: DocumentTextIcon, page: "content" },
  { to: "/admin/users", label: "Users", icon: UsersIcon, page: "users" },
  { to: "/admin/lessons", label: "Lesson Editor", icon: PencilSquareIcon, page: "lessons" },
  { to: "/admin/analytics", label: "Analytics", icon: ChartPieIcon, page: "analytics" },
  { to: "/admin/security", label: "Security", icon: LockClosedIcon, page: "security" },
  { to: "/admin/accounts", label: "Admin Accounts", icon: IdentificationIcon, page: "accounts" },
];

export default function AdminLayout() {
  const adminRole = useAuthStore((s) => s.user?.admin_role);
  // Nav visibility is a convenience, not the security boundary - every
  // page's underlying API route enforces its own require_admin_role
  // independently (web/auth_routes.py), so directly navigating to a
  // hidden URL still 403s server-side.
  const visibleItems = NAV_ITEMS.filter((item) => canAccessPage(adminRole, item.page));

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-ink-950">
      <Sidebar title="Lumi Admin" items={visibleItems} tone="admin" />
      <main className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
