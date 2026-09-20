import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

/** Route guard. requireAdmin=true additionally checks the stored user's
 * is_admin flag - real enforcement still lives server-side (require_admin
 * in web/auth_routes.py); this only prevents rendering admin UI for a
 * logged-in learner, it isn't the security boundary by itself. */
export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { token, user } = useAuthStore();

  if (!token) {
    return <Navigate to={requireAdmin ? "/admin/login" : "/login"} replace />;
  }

  if (requireAdmin && !user?.is_admin) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}
