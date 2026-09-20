import { Navigate } from "react-router-dom";
import { ROLE_PAGES } from "../../constants/adminRoles";
import { useAuthStore } from "../../store/authStore";
import AdminDashboardPage from "./AdminDashboardPage";

// "dashboard" maps to this same index route ("/admin") - redirecting to
// it would loop forever, so that case renders the page directly instead.
const PAGE_PATHS: Record<string, string> = {
  content: "/admin/content",
  users: "/admin/users",
  lessons: "/admin/lessons",
  analytics: "/admin/analytics",
  security: "/admin/security",
  accounts: "/admin/accounts",
};

/** The Dashboard page's data (RAG document counts) is IT-flavored, so it
 * isn't every role's landing page - this renders it only for roles that
 * can reach it (root_admin, it_admin), and redirects everyone else to
 * whichever page they actually can reach (e.g. a Manager lands on
 * Analytics, a Receptionist on Users), instead of a Dashboard that 403s. */
export default function AdminIndexRedirect() {
  const role = useAuthStore((s) => s.user?.admin_role);
  const firstPage = role ? ROLE_PAGES[role][0] : undefined;

  if (firstPage === "dashboard" || !firstPage) return <AdminDashboardPage />;
  return <Navigate to={PAGE_PATHS[firstPage]} replace />;
}
