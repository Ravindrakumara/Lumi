import { BookOpenIcon, ChatBubbleLeftRightIcon, HashtagIcon, SpeakerWaveIcon } from "@heroicons/react/24/solid";
import Badge from "../atoms/Badge";
import type { LessonSummary } from "../../types";

interface LessonCardProps {
  lesson: LessonSummary;
  onStart: (lessonId: string) => void;
}

// Purely a visual accent (which glyph/color a lesson's badge gets) - kept
// deterministic per lesson id, not tied to any real "lesson type" field
// the backend doesn't have, so the same lesson always looks the same.
const BADGES = [
  { Icon: ChatBubbleLeftRightIcon, bg: "bg-brand-500", shadow: "shadow-[0_8px_16px_rgba(59,111,237,0.28)]" },
  { Icon: HashtagIcon, bg: "bg-live-500", shadow: "shadow-[0_8px_16px_rgba(255,106,69,0.28)]" },
  { Icon: BookOpenIcon, bg: "bg-brand-500", shadow: "shadow-[0_8px_16px_rgba(59,111,237,0.28)]" },
  { Icon: SpeakerWaveIcon, bg: "bg-live-500", shadow: "shadow-[0_8px_16px_rgba(255,106,69,0.28)]" },
];

function badgeFor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return BADGES[hash % BADGES.length];
}

export default function LessonCard({ lesson, onStart }: LessonCardProps) {
  const { Icon, bg, shadow } = badgeFor(lesson.id);

  return (
    <div
      className={`flex flex-col gap-2.5 rounded-[18px] border border-slate-200 bg-white p-5 pt-[22px] transition-shadow dark:border-ink-700 dark:bg-ink-900 ${
        lesson.is_locked ? "opacity-60" : "hover:shadow-md dark:hover:border-ink-500 dark:hover:shadow-none"
      }`}
    >
      <span className={`mb-0.5 flex h-[52px] w-[52px] items-center justify-center rounded-full ${bg} ${shadow}`}>
        <Icon className="h-6 w-6 text-white" />
      </span>

      <h3 className="font-display text-[17px] font-extrabold leading-snug text-ink-900 dark:text-ink-100">
        {lesson.is_locked && "🔒 "}
        {lesson.title}
      </h3>
      <p className="flex-1 text-[13px] leading-relaxed text-slate-500 dark:text-ink-400">{lesson.description}</p>

      <div className="flex items-center justify-between">
        <Badge tone="brand">{lesson.level}</Badge>
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-slate-400 dark:text-ink-400">
        <span>⏱ {lesson.duration_minutes} min</span>
        <span>✎ {lesson.exercise_count} exercises</span>
        <span>🎯 {lesson.max_score} pts</span>
      </div>

      {lesson.is_locked && lesson.locked_reason ? (
        <p className="text-xs text-amber-600 dark:text-amber-400">{lesson.locked_reason}</p>
      ) : null}

      <button
        type="button"
        disabled={lesson.is_locked}
        onClick={() => onStart(lesson.id)}
        className={`mt-1 rounded-full py-2.5 text-[13px] font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:opacity-60 ${bg}`}
      >
        {lesson.is_locked ? "Locked" : "Start lesson →"}
      </button>
    </div>
  );
}
