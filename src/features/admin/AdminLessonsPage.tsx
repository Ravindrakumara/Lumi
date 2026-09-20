import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { adminLessonsApi } from "../../api/adminLessonsApi";
import Badge from "../../components/atoms/Badge";
import Button from "../../components/atoms/Button";
import Spinner from "../../components/atoms/Spinner";
import AdminDataTable, { type Column } from "../../components/organisms/AdminDataTable";
import type { LessonSummary } from "../../types";
import CreateLessonDialog from "./CreateLessonDialog";
import LessonMaterialDialog from "./LessonMaterialDialog";

export default function AdminLessonsPage() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [materialLesson, setMaterialLesson] = useState<LessonSummary | null>(null);

  const { data: lessons, isLoading } = useQuery({
    queryKey: ["admin", "lessons"],
    queryFn: adminLessonsApi.list,
  });

  const deleteMutation = useMutation({
    mutationFn: (lessonId: string) => adminLessonsApi.remove(lessonId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "lessons"] }),
  });

  const columns: Column<LessonSummary>[] = [
    { key: "title", label: "Title" },
    { key: "level", label: "Level", render: (row) => <Badge tone="brand">{row.level}</Badge> },
    { key: "topic", label: "Topic" },
    { key: "exercise_count", label: "Exercises" },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <div className="flex justify-end gap-2">
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
      <LessonMaterialDialog
        lessonId={materialLesson?.id ?? null}
        lessonTitle={materialLesson?.title ?? ""}
        onClose={() => setMaterialLesson(null)}
      />
    </div>
  );
}
