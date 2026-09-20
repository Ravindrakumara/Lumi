import { ShieldCheckIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthForm from "../../components/organisms/AuthForm";
import TotpCodeForm from "../../components/molecules/TotpCodeForm";
import { useAuth } from "../../hooks/useAuth";
import { useAuthStore } from "../../store/authStore";

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { login, loginPending, loginError, verifyTotp, verifyTotpPending, verifyTotpError, logout } = useAuth();
  const [roleError, setRoleError] = useState("");
  // Set once step one (password or Google) succeeds for an admin with
  // TOTP enabled - while this is non-null, the code-entry step renders
  // instead of the normal login form.
  const [pendingToken, setPendingToken] = useState<string | null>(null);

  // Shared by both password login and Google sign-in: the backend's
  // /api/admin/* routes would 403 a non-admin anyway (require_admin
  // dependency) - rejecting here just gives a clearer message than a
  // failed API call after landing on the dashboard.
  function requireAdminOrReject(): boolean {
    if (!useAuthStore.getState().user?.is_admin) {
      logout();
      setRoleError("This account does not have admin access.");
      return false;
    }
    return true;
  }

  async function handleLogin(values: { email: string; password: string }) {
    setRoleError("");
    const result = await login(values);
    if ("totp_required" in result) {
      setPendingToken(result.totp_pending_token);
      return;
    }
    if (requireAdminOrReject()) navigate("/admin", { replace: true });
  }

  function handleOAuthSuccess() {
    setRoleError("");
    if (requireAdminOrReject()) navigate("/admin", { replace: true });
  }

  async function handleTotpSubmit(code: string) {
    if (!pendingToken) return;
    await verifyTotp({ totpPendingToken: pendingToken, code });
    if (requireAdminOrReject()) navigate("/admin", { replace: true });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-slate-300">
          <ShieldCheckIcon className="h-10 w-10 text-admin-500" />
          <p className="text-xs uppercase tracking-widest text-slate-500">Restricted access</p>
        </div>
        {pendingToken ? (
          <TotpCodeForm
            tone="admin"
            onSubmit={handleTotpSubmit}
            onCancel={() => setPendingToken(null)}
            pending={verifyTotpPending}
            error={verifyTotpError?.response?.data?.detail}
          />
        ) : (
          <AuthForm
            title="RAV-AI Admin"
            tone="admin"
            allowRegister={false}
            onLogin={handleLogin}
            onOAuthSuccess={handleOAuthSuccess}
            onOAuthTotpRequired={setPendingToken}
            pending={loginPending}
            error={roleError || loginError?.response?.data?.detail}
          />
        )}
      </div>
    </div>
  );
}
