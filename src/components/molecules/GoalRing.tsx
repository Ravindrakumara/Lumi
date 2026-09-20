interface GoalRingProps {
  done: number;
  total: number;
  size?: number;
  stroke?: number;
}

/** Real SVG circular progress ring (stroke-dashoffset), not a CSS trick or
 * plain text badge - used for the "Today's Goal" sidebar widget. */
export default function GoalRing({ done, total, size = 88, stroke = 8 }: GoalRingProps) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = total > 0 ? Math.min(1, done / total) : 0;
  const offset = circumference * (1 - pct);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} strokeWidth={stroke} className="fill-none stroke-slate-100" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="fill-none stroke-brand-500 transition-[stroke-dashoffset] duration-500 ease-out"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-slate-700">
        {done}/{total}
      </span>
    </div>
  );
}
