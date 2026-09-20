import Badge from "../atoms/Badge";
import Button from "../atoms/Button";
import Card from "../atoms/Card";
import type { LessonSummary } from "../../types";

interface LessonCardProps {
  lesson: LessonSummary;
  onStart: (lessonId: string) => void;
}

export default function LessonCard({ lesson, onStart }: LessonCardProps) {
  return (
    <Card className="flex flex-col gap-2 transition-shadow hover:shadow-md dark:hover:shadow-none dark:hover:border-ink-500">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-slate-900 dark:text-ink-100">{lesson.title}</h3>
        <Badge tone="brand">{lesson.level}</Badge>
      </div>
      <p className="text-sm text-slate-600 dark:text-ink-400">{lesson.description}</p>
      <div className="flex flex-wrap gap-2 text-xs text-slate-500 dark:text-ink-400">
        <span>📘 {lesson.topic}</span>
        <span>⏱ {lesson.duration_minutes} min</span>
        <span>📝 {lesson.exercise_count} exercises</span>
        <span>🎯 {lesson.max_score} pts</span>
      </div>
      <Button className="mt-2 self-start" onClick={() => onStart(lesson.id)}>
        Start lesson
      </Button>
    </Card>
  );
}
