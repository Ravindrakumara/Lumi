const TONES = {
  // Solid, saturated card colors (like Mongi's control-room stat cards) in
  // light mode; a softer translucent tint in dark mode so it doesn't glare.
  neutral: {
    card: "bg-white border border-slate-200 dark:border-ink-700 dark:bg-ink-900",
    value: "text-slate-900 dark:text-ink-100",
    label: "text-slate-400 dark:text-ink-400",
    bar: "bg-live-500",
    track: "bg-slate-100 dark:bg-ink-800",
  },
  success: {
    card: "bg-emerald-200 dark:border dark:border-emerald-500/20 dark:bg-emerald-500/10",
    value: "text-emerald-900 dark:text-emerald-300",
    label: "text-emerald-700/70 dark:text-emerald-400/70",
    bar: "bg-emerald-600 dark:bg-emerald-400",
    track: "bg-emerald-300/60 dark:bg-emerald-500/20",
  },
  warning: {
    card: "bg-amber-200 dark:border dark:border-amber-500/20 dark:bg-amber-500/10",
    value: "text-amber-900 dark:text-amber-300",
    label: "text-amber-700/70 dark:text-amber-400/70",
    bar: "bg-amber-600 dark:bg-amber-400",
    track: "bg-amber-300/60 dark:bg-amber-500/20",
  },
  info: {
    card: "bg-sky-200 dark:border dark:border-sky-500/20 dark:bg-sky-500/10",
    value: "text-sky-900 dark:text-sky-300",
    label: "text-sky-700/70 dark:text-sky-400/70",
    bar: "bg-sky-600 dark:bg-sky-400",
    track: "bg-sky-300/60 dark:bg-sky-500/20",
  },
  highlight: {
    card: "bg-violet-200 dark:border dark:border-violet-500/20 dark:bg-violet-500/10",
    value: "text-violet-900 dark:text-violet-300",
    label: "text-violet-700/70 dark:text-violet-400/70",
    bar: "bg-violet-600 dark:bg-violet-400",
    track: "bg-violet-300/60 dark:bg-violet-500/20",
  },
} as const;

export type StatTileTone = keyof typeof TONES;

interface StatTileProps {
  value: string | number;
  label: string;
  /** Color-codes the tile by meaning (Mongi-style control-room cards) -
   * "neutral" (default) is a plain readout with no implied judgment. */
  tone?: StatTileTone;
  /** 0-100. Omit to render the tile without the mini readout bar. */
  percent?: number;
}

/** Compact "instrument readout" tile - value, label, optional mini bar.
 * Used anywhere a number should read as a live measurement rather than
 * static text (score, accuracy, weight/energy-style stats). */
export default function StatTile({ value, label, tone = "neutral", percent }: StatTileProps) {
  const t = TONES[tone];
  return (
    <div className={`rounded-lg px-3 py-2.5 ${t.card}`}>
      <p className={`text-lg font-bold leading-none ${t.value}`}>{value}</p>
      <p className={`mt-1 text-[11px] uppercase tracking-wide ${t.label}`}>{label}</p>
      {percent != null ? (
        <div className={`mt-2 h-1 rounded-full ${t.track}`}>
          <div
            className={`h-1 rounded-full transition-all ${t.bar}`}
            style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
          />
        </div>
      ) : null}
    </div>
  );
}
