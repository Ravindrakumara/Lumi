import { useQuery } from "@tanstack/react-query";
import { StarIcon } from "@heroicons/react/24/solid";
import { progressApi } from "../../api/progressApi";
import PageHeader from "../../components/atoms/PageHeader";
import Spinner from "../../components/atoms/Spinner";

export default function AchievementsPage() {
  const { data: achievements, isLoading } = useQuery({
    queryKey: ["achievements"],
    queryFn: () => progressApi.achievements(),
  });

  if (isLoading) return <Spinner />;

  return (
    <div className="flex flex-col gap-[18px]">
      <PageHeader title="Achievements" subtitle="Milestones you've unlocked, and what's next." />

      {!achievements?.length ? (
        <p className="text-sm text-slate-500 dark:text-ink-400">
          No achievements yet — they unlock as you work through lessons.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {achievements.map((a, i) => {
            const done = a.status === "done";
            const iconBg = !done ? "bg-slate-100 dark:bg-ink-800" : i % 2 === 0 ? "bg-[#fff5f1]" : "bg-brand-50";
            const iconColor = !done
              ? "text-slate-300 dark:text-ink-700"
              : i % 2 === 0
                ? "text-live-500"
                : "text-brand-500";
            return (
              <div
                key={a.title}
                className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-[18px] dark:border-ink-700 dark:bg-ink-900"
              >
                <div className="flex items-center gap-2.5">
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${iconBg}`}>
                    <StarIcon className={`h-[18px] w-[18px] ${iconColor}`} />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-display text-[15px] font-extrabold text-ink-900 dark:text-ink-100">
                      {a.title}
                    </p>
                    <p className="text-[11px] font-semibold text-slate-400 dark:text-ink-400">
                      {done ? "Unlocked" : a.progress}
                    </p>
                  </div>
                </div>
                <p className="text-[13px] leading-relaxed text-slate-500 dark:text-ink-400">{a.description}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
