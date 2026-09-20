import type { ButtonHTMLAttributes } from "react";

const VARIANTS = {
  primary: "bg-brand-500 hover:bg-brand-600 text-white",
  admin: "bg-admin-500 hover:bg-admin-600 text-white",
  secondary: "bg-slate-100 hover:bg-slate-200 text-slate-900",
  danger: "bg-red-500 hover:bg-red-600 text-white",
  ghost: "bg-transparent hover:bg-slate-100 text-slate-700",
} as const;

export type ButtonVariant = keyof typeof VARIANTS;

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
}

export default function Button({
  variant = "primary",
  disabled = false,
  loading = false,
  className = "",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium
        transition-colors disabled:opacity-50 disabled:cursor-not-allowed
        ${VARIANTS[variant]} ${className}`}
      {...rest}
    >
      {loading ? "…" : children}
    </button>
  );
}
