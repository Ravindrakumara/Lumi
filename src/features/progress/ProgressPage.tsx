import { useQuery } from "@tanstack/react-query";
import { progressApi } from "../../api/progressApi";
import Badge from "../../components/atoms/Badge";
import Card from "../../components/atoms/Card";
import PageHeader from "../../components/atoms/PageHeader";
import { JourneySnapshot } from "../../components/organisms/StatsSidebar";
import Spinner from "../../components/atoms/Spinner";
import ProgressBar from "../../components/molecules/ProgressBar";

export default function ProgressPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["progress"],
    queryFn: () => progressApi.summary(),
  });

  if (isLoading) return <Spinner />;
  if (!data) return null;

  const { summary, lessons, recommendations } = data;

  return (
    <div className="space-y-5">
      <PageHeader title="Progress" subtitle="Every lesson you've started, and how far you've got." />

      {/* On lg+ these already sit in the right sidebar; below that the
          sidebar is hidden, and this is the only way to reach them. */}
      <div className="lg:hidden">
        <JourneySnapshot />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {(
          [
            ["Started", summary.lessons_started],
            ["Completed", summary.lessons_completed],
            ["Score", `${summary.total_score}/${summary.total_max_score}`],
            ["Accuracy", `${summary.accuracy_rate}%`],
          ] as [string, string | number][]
        ).map(([label, value]) => (
          <Card key={label} className="text-center">
            <p className="font-display text-[22px] font-extrabold text-ink-900 dark:text-ink-100">{value}</p>
            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-ink-400">
              {label}
            </p>
          </Card>
        ))}
      </div>

      <div className="space-y-3">
        {lessons.map((item) => (
          <Card key={item.lesson_id}>
            <div className="mb-2 flex items-center justify-between">
              <span className="font-medium text-slate-900 dark:text-ink-100">{item.title}</span>
              <Badge tone={item.is_completed ? "success" : "neutral"}>
                {item.is_completed ? "Completed" : "In progress"}
              </Badge>
            </div>
            <ProgressBar value={item.score} max={item.max_score || 1} />
          </Card>
        ))}
      </div>

      {recommendations?.next_lesson ? (
        <div className="rounded-2xl bg-brand-50 p-4 text-sm text-brand-700 dark:bg-brand-500/10 dark:text-brand-100">
          Next up: <strong>{recommendations.next_lesson.title}</strong> ({recommendations.next_lesson.level})
        </div>
      ) : null}
    </div>
  );
}
