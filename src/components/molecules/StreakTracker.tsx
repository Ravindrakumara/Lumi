const DAYS = ["M", "T", "W", "T", "F", "S", "S"];

interface StreakTrackerProps {
  activeDays?: number;
}

/** Weekly streak strip. Ported as-is from the original vanilla app, which
 * hardcoded the first 5 days as "active" - the backend has no real streak
 * calculation yet (domain/models/progress.py's calculate_streak() is an
 * unimplemented stub), so this is still decorative, not live data. Wiring
 * it up for real needs that backend work done first. */
export default function StreakTracker({ activeDays = 5 }: StreakTrackerProps) {
  return (
    <div>
      <div className="mb-1 grid grid-cols-7 text-center text-xs text-slate-400">
        {DAYS.map((day, i) => (
          <span key={i}>{day}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {DAYS.map((_, i) => (
          <span
            key={i}
            className={`h-2 rounded-full ${i < activeDays ? "bg-brand-500" : "bg-slate-100"}`}
          />
        ))}
      </div>
    </div>
  );
}
