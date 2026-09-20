import { useQuery } from "@tanstack/react-query";
import { progressApi } from "../../api/progressApi";
import Badge from "../../components/atoms/Badge";
import Card from "../../components/atoms/Card";
import Spinner from "../../components/atoms/Spinner";

export default function AchievementsPage() {
  const { data: achievements, isLoading } = useQuery({
    queryKey: ["achievements"],
    queryFn: () => progressApi.achievements(),
  });

  if (isLoading) return <Spinner />;

  return (
    <div>
      <h2 className="mb-4 text-xl font-bold text-slate-900 dark:text-ink-100">Achievements</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {(achievements || []).map((a) => (
          <Card key={a.title}>
            <div className="mb-1 flex items-center justify-between">
              <span className="font-semibold text-slate-900 dark:text-ink-100">{a.title}</span>
              <Badge tone={a.status === "done" ? "success" : "warning"}>{a.status}</Badge>
            </div>
            <p className="mb-2 text-sm text-slate-600 dark:text-ink-400">{a.description}</p>
            <p className="text-xs text-slate-500 dark:text-ink-400">{a.progress}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
