import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { adminLessonsApi, type AdminLessonSummary } from "../../api/adminLessonsApi";
import Badge from "../../components/atoms/Badge";
import Button from "../../components/atoms/Button";
import Spinner from "../../components/atoms/Spinner";
import AdminDataTable, { type Column } from "../../components/organisms/AdminDataTable";
import CreateLessonDialog from "./CreateLessonDialog";
import EditLessonDialog from "./EditLessonDialog";
import LessonMaterialDialog from "./LessonMaterialDialog";

export default function AdminLessonsPage() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [materialLesson, setMaterialLesson] = useState<AdminLessonSummary | null>(null);
  const [editLesson, setEditLesson] = useState<AdminLessonSummary | null>(null);

  const { data: lessons, isLoading } = useQuery({
    queryKey: ["admin", "lessons"],
    queryFn: adminLessonsApi.list,
  });

  const deleteMutation = useMutation({
    mutationFn: (lessonId: string) => adminLessonsApi.remove(lessonId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "lessons"] }),
  });

  const columns: Column<AdminLessonSummary>[] = [
    {
      key: "sequence",
      label: "Seq",
      // Curriculum position - what decides which lesson a learner is handed
      // next. Blank means the lesson has no place in the order yet, so it is
      // reachable from the catalogue but never offered as the next step.
      render: (row) =>
        row.sequence == null ? (
          <span className="text-slate-400 dark:text-ink-400">—</span>
        ) : (
          <span className="font-mono text-[13px] tabular-nums text-slate-600 dark:text-ink-300">
            {row.sequence}
          </span>
        ),
    },
    { key: "title", label: "Title" },
    {
      key: "cefr_level",
      label: "CEFR",
      // Blank is the common case and means the lesson is open to every
      // learner - shown as a dash rather than an empty cell so it reads as
      // a deliberate "untagged" rather than missing data.
      render: (row) =>
        row.cefr_level ? (
          <Badge tone="neutral">{row.cefr_level}</Badge>
        ) : (
          <span className="text-slate-400 dark:text-ink-400">—</span>
        ),
    },
    { key: "topic", label: "Topic" },
    { key: "exercise_count", label: "Exercises" },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setEditLesson(row)}>
            Edit
          </Button>
          <Button variant="secondary" onClick={() => setMaterialLesson(row)}>
            Manage material
          </Button>
          <Button
            variant="danger"
            loading={deleteMutation.isPending && deleteMutation.variables === row.id}
            onClick={() => {
              if (confirm(`Delete "${row.title}"? This also removes its uploaded material.`)) {
                deleteMutation.mutate(row.id);
              }
            }}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-ink-100">Lesson Editor</h2>
          <p className="text-sm text-slate-500 dark:text-ink-400">
            Create lesson plans and upload study material scoped to each one - the mentor only draws on a
            lesson's material while a learner is actively in that lesson.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="shrink-0">
          Create lesson
        </Button>
      </div>

      {isLoading ? (
        <Spinner />
      ) : (
        <AdminDataTable columns={columns} rows={lessons || []} getKey={(row) => row.id} emptyMessage="No lessons yet." />
      )}

      <CreateLessonDialog open={createOpen} onClose={() => setCreateOpen(false)} />
      <EditLessonDialog lesson={editLesson} onClose={() => setEditLesson(null)} />
      <LessonMaterialDialog
        lessonId={materialLesson?.id ?? null}
        lessonTitle={materialLesson?.title ?? ""}
        onClose={() => setMaterialLesson(null)}
      />
    </div>
  );
}
