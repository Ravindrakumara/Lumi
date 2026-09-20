import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircleIcon, MinusCircleIcon, PlayCircleIcon } from "@heroicons/react/20/solid";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { lessonsApi } from "../../api/lessonsApi";
import Badge from "../../components/atoms/Badge";
import Button from "../../components/atoms/Button";
import Input from "../../components/atoms/Input";
import Spinner from "../../components/atoms/Spinner";
import StatTile from "../../components/atoms/StatTile";
import TextArea from "../../components/atoms/TextArea";
import ChecklistItem from "../../components/molecules/ChecklistItem";
import LessonMentorChat from "./LessonMentorChat";
import type { Exercise, ExerciseResult, LessonProgress } from "../../types";

interface CompletedStep {
  exercise: Exercise;
  result: ExerciseResult;
}

export default function LessonWorkbenchPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [progress, setProgress] = useState<LessonProgress | null>(null);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<ExerciseResult | null>(null);
  // Lets the learner click back to a completed exercise in the left rail
  // to review their question/answer/feedback, without re-submitting or
  // disturbing server-side progress (viewedIndex is purely a client-side
  // "what am I looking at" pointer, separate from the live exercise the
  // server has queued up next).
  const [history, setHistory] = useState<CompletedStep[]>([]);
  const [viewedIndex, setViewedIndex] = useState<number | null>(null);

  const { data: lesson, isLoading } = useQuery({
    queryKey: ["lesson", lessonId],
    queryFn: () => lessonsApi.detail(lessonId!),
    enabled: Boolean(lessonId),
  });

  const startMutation = useMutation({
    mutationFn: () => lessonsApi.start(lessonId!),
    onSuccess: (data) => {
      setProgress(data.progress);
      setExercise(data.exercise);
      setFeedback(null);
    },
  });

  const submitMutation = useMutation({
    mutationFn: (submittedAnswer: string) => lessonsApi.submit(lessonId!, exercise!.id, submittedAnswer),
    onSuccess: (data) => {
      if (exercise) {
        setHistory((prev) => [...prev, { exercise, result: data.result }]);
      }
      setProgress(data.progress);
      setFeedback(data.result);
      setExercise(data.next_exercise);
      setAnswer("");
      setViewedIndex(null);
    },
  });

  if (isLoading) return <Spinner />;
  if (!lesson) return <p className="text-sm text-red-600">Lesson not found.</p>;

  if (!progress) {
    return (
      <div className="mx-auto max-w-lg text-center">
        <h2 className="text-xl font-bold text-slate-900 dark:text-ink-100">{lesson.title}</h2>
        <p className="mb-4 text-sm text-slate-600 dark:text-ink-400">{lesson.description}</p>
        <Button onClick={() => startMutation.mutate()} loading={startMutation.isPending}>
          Start lesson
        </Button>
      </div>
    );
  }

  const attempted = progress.exercises_attempted;
  const total = lesson.exercises.length;
  const currentIndex = exercise ? lesson.exercises.findIndex((e) => e.id === exercise.id) : total;
  const accuracy = attempted > 0 ? Math.round((progress.exercises_passed / attempted) * 100) : 0;
  const lessonPct = total > 0 ? Math.round((attempted / total) * 100) : 0;
  const viewedStep = viewedIndex !== null ? history[viewedIndex] : null;

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-ink-100">{lesson.title}</h2>
        <p className="text-sm text-slate-500 dark:text-ink-400">{lesson.description}</p>
      </div>

      <div className="grid flex-1 gap-4 lg:grid-cols-[200px_minmax(0,1fr)]">
        {/* Left: exercise rail - same role as the reference's component tree */}
        <aside className="space-y-1 rounded-2xl border border-slate-200 bg-white shadow-sm dark:shadow-none p-3 dark:border-ink-700 dark:bg-ink-900">
          <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-ink-400">
            Exercises
          </p>
          {lesson.exercises.map((ex, i) => {
            const isDone = i < attempted;
            const isCurrent = viewedIndex === null && i === currentIndex;
            const isViewed = viewedIndex === i;
            return (
              <div
                key={ex.id}
                role={isDone ? "button" : undefined}
                tabIndex={isDone ? 0 : undefined}
                onClick={() => {
                  if (isDone) setViewedIndex(i);
                }}
                className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs
                  ${isDone ? "cursor-pointer hover:bg-slate-50 dark:hover:bg-ink-800" : ""}
                  ${
                    isCurrent || isViewed
                      ? "bg-live-500/10 text-live-600 dark:text-live-500"
                      : "text-slate-600 dark:text-ink-400"
                  }`}
              >
                {isDone ? (
                  <CheckCircleIcon className="h-4 w-4 shrink-0 text-emerald-500" />
                ) : isCurrent ? (
                  <PlayCircleIcon className="h-4 w-4 shrink-0" />
                ) : (
                  <MinusCircleIcon className="h-4 w-4 shrink-0 text-slate-300 dark:text-ink-700" />
                )}
                <span className="truncate">Exercise {i + 1}</span>
              </div>
            );
          })}
        </aside>

        {/* Center + right rail nest together so the right rail only takes a
            column of its own on genuinely spacious screens - at ordinary
            laptop widths (where this used to starve the exercise content
            down to a sliver, see git history) it stacks below instead. */}
        <div className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_240px]">
        <div className="space-y-3">
          {viewedStep ? (
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:shadow-none p-5 dark:border-ink-700 dark:bg-ink-900">
              <div className="mb-3 flex items-center justify-between">
                <Badge tone="neutral">Reviewing exercise {viewedIndex! + 1}</Badge>
                <Button variant="secondary" onClick={() => setViewedIndex(null)}>
                  {exercise ? "Continue" : "Back to results"}
                </Button>
              </div>
              <p className="mb-4 text-lg font-medium text-slate-900 dark:text-ink-100">
                {viewedStep.exercise.question}
              </p>
              <div
                className={`rounded-lg p-3 text-sm ${viewedStep.result.is_correct ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"}`}
              >
                {viewedStep.result.feedback}
              </div>
            </div>
          ) : (
            <>
          {feedback ? (
            <div
              className={`rounded-lg p-3 text-sm ${feedback.is_correct ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400" : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"}`}
            >
              {feedback.feedback}
            </div>
          ) : null}

          {exercise ? (
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:shadow-none p-5 dark:border-ink-700 dark:bg-ink-900">
              <Badge tone="brand">{exercise.type.replace("_", " ")}</Badge>
              <p className="mb-4 mt-3 text-lg font-medium text-slate-900 dark:text-ink-100">{exercise.question}</p>

              {exercise.type === "multiple_choice" && exercise.choices ? (
                <div className="grid gap-2">
                  {exercise.choices.map((choice) => (
                    <Button
                      key={choice}
                      variant="secondary"
                      className="justify-start"
                      onClick={() => submitMutation.mutate(choice)}
                      loading={submitMutation.isPending}
                    >
                      {choice}
                    </Button>
                  ))}
                </div>
              ) : exercise.type === "essay" || exercise.type === "conversation" ? (
                <form
                  className="space-y-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    submitMutation.mutate(answer);
                  }}
                >
                  <TextArea
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Write your response here..."
                    rows={8}
                  />
                  <Button type="submit" loading={submitMutation.isPending}>
                    Submit
                  </Button>
                </form>
              ) : (
                <form
                  className="flex min-w-0 gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    submitMutation.mutate(answer);
                  }}
                >
                  <Input
                    className="min-w-0 flex-1"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Your answer"
                  />
                  <Button type="submit" loading={submitMutation.isPending}>
                    Submit
                  </Button>
                </form>
              )}
            </div>
          ) : (
            <p className="rounded-lg bg-emerald-50 p-4 text-sm font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
              🎉 Lesson complete! Final score: {progress.score}/{lesson.max_score}
            </p>
          )}
            </>
          )}
        </div>

        {/* Right: live checklist + stat tiles - same role as the reference's
            Compatibility panel + Weight/Energy/PERF tiles */}
        <aside className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:shadow-none p-3 dark:border-ink-700 dark:bg-ink-900">
            <p className="mb-1 px-1 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-ink-400">
              Session status
            </p>
            <ChecklistItem label="Lesson started" ok />
            <ChecklistItem label="Answer submitted" ok={feedback != null} />
            <ChecklistItem label="All exercises done" ok={exercise === null} />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <StatTile value={`${attempted}/${total}`} label="Attempted" percent={lessonPct} tone="info" />
            <StatTile value={progress.score} label="Score" tone="highlight" />
            <StatTile
              value={`${accuracy}%`}
              label="Accuracy"
              percent={accuracy}
              tone={attempted === 0 ? "neutral" : accuracy >= 70 ? "success" : "warning"}
            />
          </div>

          {lessonId ? <LessonMentorChat lessonId={lessonId} /> : null}
        </aside>
        </div>
      </div>

      {/* Persistent bottom status bar - same role as the reference's Power
          Budget bar: always visible, whichever exercise you're on. */}
      <div className="mt-4 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white shadow-sm dark:shadow-none px-4 py-2 dark:border-ink-700 dark:bg-ink-900">
        <span className="text-xs font-medium text-slate-500 dark:text-ink-400">Lesson progress</span>
        <div className="h-1.5 flex-1 rounded-full bg-slate-100 dark:bg-ink-800">
          <div className="h-1.5 rounded-full bg-live-500 transition-all" style={{ width: `${lessonPct}%` }} />
        </div>
        <span className="text-xs text-slate-500 dark:text-ink-400">{lessonPct}%</span>
      </div>
    </div>
  );
}
