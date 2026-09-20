import { useState } from "react";
import Button, { type ButtonVariant } from "../atoms/Button";
import FormField from "../molecules/FormField";
import GoogleSignInButton from "./GoogleSignInButton";

interface AuthFormProps {
  title: string;
  tone?: ButtonVariant;
  allowRegister?: boolean;
  onLogin: (values: { email: string; password: string }) => void;
  onRegister?: (values: { email: string; name: string; password: string }) => void;
  // Fired after a successful Google sign-in (the token is already stored -
  // see GoogleSignInButton). Each page does its own post-login logic here
  // (learner just navigates; admin also re-checks is_admin), same as it
  // already does after a password login.
  onOAuthSuccess?: () => void;
  onOAuthTotpRequired?: (pendingToken: string) => void;
  pending?: boolean;
  error?: string;
}

/** Shared login/register form for both portals.
 * allowRegister=false (admin portal) hides the register toggle entirely -
 * a root admin account should never be self-service signup. */
export default function AuthForm({
  title,
  tone = "primary",
  allowRegister = false,
  onLogin,
  onRegister,
  onOAuthSuccess,
  onOAuthTotpRequired,
  pending,
  error,
}: AuthFormProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [oauthError, setOauthError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === "register") {
      onRegister?.({ email, name, password });
    } else {
      onLogin({ email, password });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-8 shadow-lg">
      <h1 className="text-xl font-bold text-slate-900">{title}</h1>

      {mode === "register" ? (
        <FormField label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
      ) : null}

      <FormField
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <FormField
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength={6}
      />

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <Button type="submit" variant={tone} loading={pending} className="w-full">
        {mode === "register" ? "Create account" : "Log in"}
      </Button>

      {allowRegister ? (
        <button
          type="button"
          className="w-full text-center text-sm text-slate-500 hover:underline"
          onClick={() => setMode(mode === "login" ? "register" : "login")}
        >
          {mode === "login" ? "Need an account? Register" : "Already have an account? Log in"}
        </button>
      ) : null}

      {onOAuthSuccess ? (
        <>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="h-px flex-1 bg-slate-200" />
            or continue with
            <span className="h-px flex-1 bg-slate-200" />
          </div>
          {oauthError ? <p className="text-sm text-red-600">{oauthError}</p> : null}
          <GoogleSignInButton
            onSuccess={onOAuthSuccess}
            onError={setOauthError}
            onTotpRequired={onOAuthTotpRequired}
          />
        </>
      ) : null}
    </form>
  );
}
