import { useQuery } from "@tanstack/react-query";
import { StarIcon } from "@heroicons/react/24/solid";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { profileApi } from "../../api/profileApi";
import { progressApi } from "../../api/progressApi";
import type { LessonLevel } from "../../types";
import StatTile from "../atoms/StatTile";
import GoalRing from "../molecules/GoalRing";

// Not a daily target - the API exposes lifetime counts only, so this
// is 'your first 3 lessons', labelled as such.
const DAILY_GOAL = 3;

// Same 4-tier ladder LessonsPage/SettingsPage let a learner choose from -
// used here purely to place their current Program on a "journey" strip,
// not a separate concept of its own.
const JOURNEY_TIERS: { id: LessonLevel; label: string }[] = [
  { id: "primary", label: "Primary" },
  { id: "secondary", label: "Secondary" },
  { id: "college", label: "College" },
  { id: "professional", label: "Professional" },
];

function StatCard({ title, viewAllTo, children }: { title: string; viewAllTo?: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-[18px] dark:border-ink-700 dark:bg-ink-900">
      <div className="mb-3 flex items-center justify-between text-sm">
        <span className="font-semibold text-slate-800 dark:text-ink-100">{title}</span>
        {viewAllTo ? (
          <Link to={viewAllTo} className="text-xs font-medium text-brand-500 hover:underline dark:text-live-500">
            View all
          </Link>
        ) : null}
      </div>
      {children}
    </div>
  );
}

// Point layout for the wave path below - evenly spaced on x, alternating
// low/high on y, same amplitude/viewBox as the mockup's hand-drawn curve.
const WAVE_VIEWBOX = { w: 260, h: 56 };
const WAVE_X = [14, 91, 168, 246];
const WAVE_Y = [40, 16, 40, 16];

function cubicSegment(x1: number, y1: number, x2: number, y2: number) {
  const dx = (x2 - x1) / 2;
  return `C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`;
}

export function JourneyCard({ currentTierId }: { currentTierId: string | undefined }) {
  const currentIndex = Math.max(
    0,
    JOURNEY_TIERS.findIndex((t) => t.id === currentTierId)
  );
  const lastIndex = JOURNEY_TIERS.length - 1;
  const remaining = lastIndex - currentIndex;

  const fullPath = `M${WAVE_X[0]},${WAVE_Y[0]} ${WAVE_X.slice(1)
    .map((x, i) => cubicSegment(WAVE_X[i], WAVE_Y[i], x, WAVE_Y[i + 1]))
    .join(" ")}`;
  const traveledPath =
    currentIndex > 0
      ? `M${WAVE_X[0]},${WAVE_Y[0]} ${WAVE_X.slice(1, currentIndex + 1)
          .map((x, i) => cubicSegment(WAVE_X[i], WAVE_Y[i], x, WAVE_Y[i + 1]))
          .join(" ")}`
      : null;

  return (
    <div className="rounded-2xl border border-[#e4ecfb] bg-gradient-to-br from-[#eef4ff] to-[#fff7f2] p-[18px] dark:border-ink-700 dark:from-ink-900 dark:to-ink-900">
      <div className="mb-2.5 flex items-center justify-between">
        <span className="text-[13.5px] font-semibold text-slate-800 dark:text-ink-100">Your Journey</span>
        <span className="whitespace-nowrap text-[11px] font-bold text-live-500">
          {remaining > 0 ? `${remaining} to go 🏆` : "Top tier 🏆"}
        </span>
      </div>
      <svg viewBox={`0 0 ${WAVE_VIEWBOX.w} ${WAVE_VIEWBOX.h}`} width="100%" height="52">
        <path d={fullPath} fill="none" stroke="#e4e7ee" strokeWidth="3" strokeLinecap="round" />
        {traveledPath ? (
          <path d={traveledPath} fill="none" stroke="#ff6a45" strokeWidth="3" strokeLinecap="round" />
        ) : null}
        {WAVE_X.map((x, i) => {
          const isStart = i === 0;
          const isCurrent = i === currentIndex;
          const isEnd = i === lastIndex;
          if (isStart || isCurrent) {
            return (
              <g key={i}>
                <circle cx={x} cy={WAVE_Y[i]} r={9} fill={isCurrent && !isStart ? "#f1f6ff" : "#fff5f1"} />
                <circle cx={x} cy={WAVE_Y[i]} r={5.5} fill={isCurrent && !isStart ? "#3b6fed" : "#ff6a45"} />
              </g>
            );
          }
          if (isEnd) {
            return (
              <g key={i}>
                <circle cx={x} cy={WAVE_Y[i]} r={8} fill="#f1f6ff" />
                <circle cx={x} cy={WAVE_Y[i]} r={4.5} fill="#3b6fed" />
              </g>
            );
          }
          return <circle key={i} cx={x} cy={WAVE_Y[i]} r={4.5} fill="#ffffff" stroke="#dfe3ee" strokeWidth={2} />;
        })}
      </svg>
      <div className="mt-0.5 flex justify-between text-[10px] font-bold">
        <span className="text-live-600">You &middot; {JOURNEY_TIERS[currentIndex]?.label ?? "Primary"}</span>
        <span className="text-brand-500">{JOURNEY_TIERS[lastIndex].label}</span>
      </div>
    </div>
  );
}

/** Journey + Getting started - the two widgets that exist only in this
 * sidebar. Below lg the sidebar is hidden, so ProgressPage renders these
 * instead and nothing becomes unreachable on a phone. */
export function JourneySnapshot() {
  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: profileApi.get });
  const { data: progressData } = useQuery({ queryKey: ["progress"], queryFn: () => progressApi.summary() });

  const summary = progressData?.summary;
  const completed = summary?.lessons_completed ?? 0;
  const started = summary?.lessons_started ?? 0;
  const dailyDone = Math.min(completed || started, DAILY_GOAL);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <JourneyCard currentTierId={profile?.program.id} />
      <StatCard title="Getting started">
        <div className="flex items-center gap-4">
          <GoalRing done={dailyDone} total={DAILY_GOAL} />
          <p className="text-sm text-slate-600 dark:text-ink-400">
            {dailyDone >= DAILY_GOAL
              ? "First 3 lessons done 🎉"
              : `${dailyDone} of ${DAILY_GOAL} first lessons complete.`}
          </p>
        </div>
      </StatCard>
      <div className="sm:col-span-2">
      </div>
    </div>
  );
}

export default function StatsSidebar() {
  // Shares the same query cache as ProgressPage/AchievementsPage/the rest
  // of the app (same queryKeys), so this costs no extra network requests
  // when several of them are mounted at once - React Query dedupes.
  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: profileApi.get });
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
    <aside className="hidden w-72 flex-col gap-4 overflow-y-auto border-l border-slate-200 bg-cream p-4 dark:border-ink-700 dark:bg-ink-950 lg:flex">
      <JourneyCard currentTierId={profile?.program.id} />

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

      <StatCard title="Getting started">
        <div className="flex items-center gap-4">
          <GoalRing done={dailyDone} total={DAILY_GOAL} />
          <p className="text-sm text-slate-600 dark:text-ink-400">
            {dailyDone >= DAILY_GOAL
              ? "First 3 lessons done 🎉"
              : `${dailyDone} of ${DAILY_GOAL} first lessons complete.`}
          </p>
        </div>
      </StatCard>

      <StatCard title="Achievements" viewAllTo="/achievements">
        {topAchievements.length ? (
          <ul className="space-y-3">
            {topAchievements.map((item, i) => {
              const done = item.status === "done";
              const iconBg = !done ? "bg-slate-100 dark:bg-ink-800" : i % 2 === 0 ? "bg-[#fff5f1]" : "bg-brand-50";
              const iconColor = !done ? "text-slate-300 dark:text-ink-700" : i % 2 === 0 ? "text-live-500" : "text-brand-500";
              return (
                <li key={item.title} className="flex items-center gap-2.5">
                  <span className={`flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full ${iconBg}`}>
                    <StarIcon className={`h-[15px] w-[15px] ${iconColor}`} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-bold text-ink-900 dark:text-ink-100">{item.title}</p>
                    <p className="text-[10.5px] text-slate-400 dark:text-ink-400">
                      {done ? "Unlocked" : item.progress}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-slate-400 dark:text-ink-400">No achievements yet.</p>
        )}
      </StatCard>
    </aside>
  );
}
