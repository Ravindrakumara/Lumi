import type { ReactNode } from "react";

const TONES = {
  neutral: "bg-slate-100 text-slate-700",
  success: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-700",
  brand: "bg-brand-100 text-brand-700",
  admin: "bg-purple-100 text-admin-600",
} as const;

interface BadgeProps {
  tone?: keyof typeof TONES;
  children: ReactNode;
}

export default function Badge({ tone = "neutral", children }: BadgeProps) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${TONES[tone]}`}>
      {children}
    </span>
  );
}
