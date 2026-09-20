import { CheckCircleIcon, ClockIcon } from "@heroicons/react/20/solid";

interface ChecklistItemProps {
  label: string;
  ok: boolean;
  detail?: string;
}

/** The "✓ Head ↔ Body OK" row pattern - a live check against a condition,
 * not just a static status badge. Used for exercise/lesson validation. */
export default function ChecklistItem({ label, ok, detail }: ChecklistItemProps) {
  return (
    <div className="flex items-center justify-between gap-2 py-1 text-sm">
      <span className="flex items-center gap-2 text-slate-700 dark:text-ink-100">
        {ok ? (
          <CheckCircleIcon className="h-4 w-4 shrink-0 text-emerald-500" />
        ) : (
          <ClockIcon className="h-4 w-4 shrink-0 text-slate-400 dark:text-ink-400" />
        )}
        {label}
      </span>
      <span className={ok ? "text-xs font-medium text-emerald-600" : "text-xs text-slate-400 dark:text-ink-400"}>
        {detail ?? (ok ? "OK" : "Pending")}
      </span>
    </div>
  );
}
