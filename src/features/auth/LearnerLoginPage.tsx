import { SparklesIcon } from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import AuthForm from "../../components/organisms/AuthForm";
import { useAuth } from "../../hooks/useAuth";

export default function LearnerLoginPage() {
  const navigate = useNavigate();
  const { login, loginPending, loginError, register, registerPending, registerError } = useAuth();

  async function handleLogin(values: { email: string; password: string }) {
    await login(values);
    navigate("/", { replace: true });
  }

  async function handleRegister(values: { email: string; name: string; password: string }) {
    await register(values);
    navigate("/", { replace: true });
  }

  return (
    <div className="flex min-h-screen">
      <div className="hidden flex-1 flex-col justify-between bg-gradient-to-br from-brand-600 to-brand-700 p-12 text-white lg:flex">
        <div className="flex items-center gap-2 text-lg font-bold">
          <SparklesIcon className="h-6 w-6" />
          RAV-AI
        </div>
        <div>
          <h2 className="mb-3 text-3xl font-bold leading-tight">
            Learn English with an AI mentor that adapts to you.
          </h2>
          <p className="max-w-md text-brand-100">
            Chat, take lessons, track your progress, and practice speaking — with a natural voice
            that works online or fully offline.
          </p>
        </div>
        <p className="text-sm text-brand-100/70">© {new Date().getFullYear()} RAV-AI</p>
      </div>

      <div className="flex flex-1 items-center justify-center bg-slate-50 p-6">
        <AuthForm
          title="Log in to RAV-AI"
          tone="primary"
          allowRegister
          onLogin={handleLogin}
          onRegister={handleRegister}
          onOAuthSuccess={() => navigate("/", { replace: true })}
          pending={loginPending || registerPending}
          error={loginError?.response?.data?.detail || registerError?.response?.data?.detail}
        />
      </div>
    </div>
  );
}
