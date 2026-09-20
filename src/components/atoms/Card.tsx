import type { HTMLAttributes } from "react";

const PADDING = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-5",
} as const;

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: keyof typeof PADDING;
}

// The one place that defines what a "card" looks like - this same
// rounded-xl/border/bg pattern used to be copy-pasted verbatim across 17+
// files, so changing the visual language (radius, shadow, border) meant
// hunting through all of them. Bigger radius + a soft shadow than before,
// closer to the original vanilla app's rounder, softer panels.
export default function Card({ padding = "md", className = "", children, ...rest }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-ink-700 dark:bg-ink-900 dark:shadow-none ${PADDING[padding]} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}
