import { BookOpenIcon, ChatBubbleLeftRightIcon, HashtagIcon, LockClosedIcon, SpeakerWaveIcon } from "@heroicons/react/24/solid";
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
  const locked = lesson.is_locked;

  return (
    <div
      className={`relative overflow-hidden rounded-[18px] border bg-white transition-shadow dark:bg-ink-900 ${
        locked
          ? "border-slate-200 dark:border-ink-700"
          : "border-slate-200 hover:shadow-md dark:border-ink-700 dark:hover:border-ink-500"
      }`}
    >
      {/* The whole card is blurred when locked, not just the button greyed
          out - a lesson the learner cannot open should read as closed at a
          glance rather than inviting them to try. aria-hidden because the
          blurred copy is decoration; the overlay below carries the real
          information for screen readers. */}
      <div
        aria-hidden={locked}
        className={`flex h-full flex-col gap-2.5 p-5 pt-[22px] ${
          locked
            ? "pointer-events-none select-none blur-[5px] saturate-50 opacity-70"
            : ""
        }`}
      >
        <span className={`mb-0.5 flex h-[52px] w-[52px] items-center justify-center rounded-full ${bg} ${shadow}`}>
          <Icon className="h-6 w-6 text-white" />
        </span>

        <h3 className="font-display text-[17px] font-extrabold leading-snug text-ink-900 dark:text-ink-100">
          {lesson.is_completed && !locked ? "✅ " : ""}
          {lesson.title}
        </h3>
        <p className="flex-1 text-[13px] leading-relaxed text-slate-500 dark:text-ink-400">{lesson.description}</p>

        <div className="flex flex-wrap items-center gap-2">
          {lesson.cefr_level ? <Badge tone="brand">{lesson.cefr_level}</Badge> : null}
          <Badge tone="neutral">{lesson.topic}</Badge>
          {lesson.is_completed ? <Badge tone="success">Completed</Badge> : null}
        </div>

        <div className="flex flex-wrap gap-3 text-xs text-slate-400 dark:text-ink-400">
          <span>⏱ {lesson.duration_minutes} min</span>
          <span>✎ {lesson.exercise_count} exercises</span>
          <span>🎯 {lesson.max_score} pts</span>
        </div>

        <button
          type="button"
          disabled={locked}
          onClick={() => onStart(lesson.id)}
          className={`mt-1 rounded-full py-2.5 text-[13px] font-bold transition-opacity hover:opacity-90 disabled:cursor-not-allowed ${
            lesson.is_completed
              ? "border border-emerald-500 bg-white text-emerald-700 dark:bg-ink-900 dark:text-emerald-400"
              : `text-white ${bg}`
          }`}
        >
          {lesson.is_completed
            ? `Completed · ${lesson.score}/${lesson.max_score} — review`
            : "Start lesson →"}
        </button>
      </div>

      {/* Sits above the blur, unblurred: the lock and what to do about it
          are the only things a learner needs from a card they cannot open.
          Without this the card would be pretty and useless - they would
          have no way to find out how to unlock it. */}
      {locked ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/55 px-5 text-center backdrop-blur-[1px] dark:bg-ink-900/55">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-200/90 dark:bg-ink-700">
            <LockClosedIcon className="h-5 w-5 text-slate-500 dark:text-ink-400" />
          </span>
          <p className="text-[13px] font-bold text-slate-700 dark:text-ink-100">Locked</p>
          {lesson.locked_reason ? (
            <p className="text-[12px] font-medium leading-snug text-slate-600 dark:text-ink-400">
              {lesson.locked_reason}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
