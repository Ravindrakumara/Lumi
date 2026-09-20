import { useState } from "react";
import Button, { type ButtonVariant } from "../atoms/Button";
import FormField from "./FormField";

interface TotpCodeFormProps {
  title?: string;
  description?: string;
  submitLabel?: string;
  tone?: ButtonVariant;
  onSubmit: (code: string) => void;
  onCancel?: () => void;
  pending?: boolean;
  error?: string;
}

/** A 6-digit authenticator-app code entry, shared by the login step-two
 * flow (AdminLoginPage) and TOTP enrollment (enable/disable in
 * TwoFactorSettings) - same shape, different submit handler. */
export default function TotpCodeForm({
  title = "Enter your authentication code",
  description = "Open your authenticator app and enter the current 6-digit code.",
  submitLabel = "Verify",
  tone = "primary",
  onSubmit,
  onCancel,
  pending,
  error,
}: TotpCodeFormProps) {
  const [code, setCode] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(code.trim());
      }}
      className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-8 shadow-lg dark:bg-ink-900"
    >
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-ink-100">{title}</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-ink-400">{description}</p>
      </div>

      <FormField
        label="Code"
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        required
      />

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <Button type="submit" variant={tone} loading={pending} className="w-full" disabled={code.length !== 6}>
        {submitLabel}
      </Button>

      {onCancel ? (
        <button
          type="button"
          className="w-full text-center text-sm text-slate-500 hover:underline dark:text-ink-400"
          onClick={onCancel}
        >
          Cancel
        </button>
      ) : null}
    </form>
  );
}
