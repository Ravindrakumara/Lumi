import type { TextareaHTMLAttributes } from "react";

export default function TextArea({ className = "", ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`w-full resize-y rounded-lg border border-slate-300 px-3 py-2 text-sm
        focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100
        ${className}`}
      {...rest}
    />
  );
}
