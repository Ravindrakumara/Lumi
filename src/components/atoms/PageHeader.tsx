import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /** Right-aligned control (e.g. an Edit button). */
  action?: ReactNode;
}

/** The one place the redesign's page heading style lives - display face,
 * extra-bold, with an optional muted subtitle beneath. */
export default function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-[27px] font-extrabold text-ink-900 dark:text-ink-100">{title}</h1>
        {subtitle ? <p className="mt-1 text-[14.5px] text-slate-500 dark:text-ink-400">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}
