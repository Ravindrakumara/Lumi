import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { progressApi } from "../../api/progressApi";
import Button from "../../components/atoms/Button";
import Card from "../../components/atoms/Card";
import PageHeader from "../../components/atoms/PageHeader";
import Spinner from "../../components/atoms/Spinner";

function ReportCard({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card className="flex items-center justify-between gap-4">
      <div>
        <h3 className="mb-1 font-semibold text-slate-900 dark:text-ink-100">{title}</h3>
        <p className="text-sm text-slate-600 dark:text-ink-400">{children}</p>
      </div>
      {action}
    </Card>
  );
}

export default function ReportsPage() {
  const { data, isLoading } = useQuery({ queryKey: ["progress"], queryFn: () => progressApi.summary() });

  if (isLoading) return <Spinner />;

  const summary = data?.summary;
  const recommendations = data?.recommendations;
  const nextLesson = recommendations?.next_lesson;
  const weakTopics = recommendations?.weak_topics || [];

  return (
    <div className="max-w-2xl space-y-5">
      <PageHeader title="Reports" subtitle="Learning focus and next-step recommendations." />

      <ReportCard title="Recommended focus">
        {weakTopics.length
          ? `Spend today's practice on ${weakTopics.join(", ")}.`
          : "Start one lesson so Lumi can identify your weak areas."}
      </ReportCard>

      <ReportCard
        title="Next best activity"
        // Actionable, not just descriptive - the reports page should let
        // you act on its own recommendation directly, not just read it.
        action={
          nextLesson ? (
            <Link to={`/lessons/${nextLesson.id}`}>
              <Button className="shrink-0">Start</Button>
            </Link>
          ) : (
            <Link to="/">
              <Button variant="secondary" className="shrink-0">
                Open Chat
              </Button>
            </Link>
          )
        }
      >
        {nextLesson
          ? `Complete ${nextLesson.title}, then ask the English Mentor to correct three sentences using that topic.`
          : "Review a completed lesson and use Chat for free speaking or writing correction."}
      </ReportCard>

      <ReportCard title="Current result">
        {summary?.lessons_completed || 0} completed lessons, {summary?.accuracy_rate || 0}% accuracy,{" "}
        {summary?.total_score || 0} total points.
      </ReportCard>
    </div>
  );
}
