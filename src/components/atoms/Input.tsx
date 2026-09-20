import type { InputHTMLAttributes } from "react";

export default function Input({ className = "", ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-sm
        focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100
        ${className}`}
      {...rest}
    />
  );
}
