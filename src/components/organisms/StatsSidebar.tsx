import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { progressApi } from "../../api/progressApi";
import StatTile from "../atoms/StatTile";
import GoalRing from "../molecules/GoalRing";
import StreakTracker from "../molecules/StreakTracker";

const DAILY_GOAL = 3;

function StatCard({ title, viewAllTo, children }: { title: string; viewAllTo?: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-ink-700 dark:bg-ink-900">
      <div className="mb-3 flex items-center justify-between text-sm">
        <span className="font-semibold text-slate-800 dark:text-ink-100">{title}</span>
        {viewAllTo ? (
          <Link to={viewAllTo} className="text-xs font-medium text-brand-600 hover:underline dark:text-live-500">
            View all
          </Link>
        ) : null}
      </div>
      {children}
    </div>
  );
}

export default function StatsSidebar() {
  // Shares the same query cache as ProgressPage/AchievementsPage (same
  // queryKey), so this costs no extra network requests when both are
  // mounted - React Query dedupes automatically.
  const { data: progressData } = useQuery({ queryKey: ["progress"], queryFn: () => progressApi.summary() });
  const { data: achievements } = useQuery({ queryKey: ["achievements"], queryFn: () => progressApi.achievements() });

  const summary = progressData?.summary;
  const score = summary?.total_score ?? 0;
  const maxScore = summary?.total_max_score ?? 0;
  const accuracy = summary?.accuracy_rate ?? 0;
  const completed = summary?.lessons_completed ?? 0;
  const started = summary?.lessons_started ?? 0;

  const level = Math.max(1, Math.floor(score / 100) + 1);
  const dailyDone = Math.min(completed || started, DAILY_GOAL);

  const topAchievements = (achievements || []).slice(0, 3);

  return (
    <aside className="flex w-72 flex-col gap-4 border-l border-slate-200 bg-slate-50 p-4 dark:border-ink-700 dark:bg-ink-950">
      <StatCard title="Your Progress" viewAllTo="/progress">
        <div className="grid grid-cols-3 gap-2">
          <StatTile value={level} label="Level" tone="info" />
          <StatTile
            value={`${accuracy}%`}
            label="Accuracy"
            percent={accuracy}
            tone={accuracy >= 70 ? "success" : "warning"}
          />
          <StatTile value={score} label={`/ ${maxScore || 100} XP`} tone="highlight" />
        </div>
      </StatCard>

      <StatCard title="Today's Goal">
        <div className="flex items-center gap-4">
          <GoalRing done={dailyDone} total={DAILY_GOAL} />
          <p className="text-sm text-slate-600 dark:text-ink-400">
            {dailyDone >= DAILY_GOAL ? "Daily goal complete." : `${DAILY_GOAL - dailyDone} lesson activity left today.`}
          </p>
        </div>
      </StatCard>

      <StatCard title="Achievements" viewAllTo="/achievements">
        {topAchievements.length ? (
          <ul className="space-y-2 text-sm">
            {topAchievements.map((item) => (
              <li key={item.title} className="flex items-center justify-between">
                <span className="text-slate-700 dark:text-ink-100">{item.title}</span>
                <span className={item.status === "done" ? "text-emerald-600" : "text-slate-400 dark:text-ink-400"}>
                  {item.status === "done" ? "✓" : item.progress}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-400 dark:text-ink-400">No achievements yet.</p>
        )}
      </StatCard>

      <StatCard title="Current Streak">
        <StreakTracker />
      </StatCard>
    </aside>
  );
}
