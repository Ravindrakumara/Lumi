import LessonCard from "./LessonCard";
import type { LessonSummary } from "../../types";

interface LessonGridProps {
  lessons?: LessonSummary[];
  onStart: (lessonId: string) => void;
}

export default function LessonGrid({ lessons = [], onStart }: LessonGridProps) {
  if (!lessons.length) {
    return <p className="text-sm text-slate-500">No lessons available for this level yet.</p>;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {lessons.map((lesson) => (
        <LessonCard key={lesson.id} lesson={lesson} onStart={onStart} />
      ))}
    </div>
  );
}
