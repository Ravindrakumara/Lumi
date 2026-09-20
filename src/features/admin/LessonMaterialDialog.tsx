import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import { adminLessonsApi } from "../../api/adminLessonsApi";
import Button from "../../components/atoms/Button";
import Spinner from "../../components/atoms/Spinner";

interface LessonMaterialDialogProps {
  lessonId: string | null;
  lessonTitle: string;
  onClose: () => void;
}

/** Material uploaded here is scoped strictly to this one lesson - the
 * mentor only draws on it while a learner is actively in this lesson
 * (see LessonWorkbenchPage's in-lesson chat), never in general Chat
 * conversation and never for a different lesson. */
export default function LessonMaterialDialog({ lessonId, lessonTitle, onClose }: LessonMaterialDialogProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: documents, isLoading } = useQuery({
    queryKey: ["admin", "lessons", lessonId, "material"],
    queryFn: () => adminLessonsApi.listMaterial(lessonId!),
    enabled: lessonId !== null,
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => adminLessonsApi.uploadMaterial(lessonId!, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "lessons", lessonId, "material"] });
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (documentId: number) => adminLessonsApi.deleteMaterial(lessonId!, documentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "lessons", lessonId, "material"] }),
  });

  return (
    <Dialog open={lessonId !== null} onClose={onClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-black/40" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-ink-900">
          <DialogTitle className="text-lg font-bold text-slate-900 dark:text-ink-100">
            Material - {lessonTitle}
          </DialogTitle>
          <p className="mt-1 text-sm text-slate-500 dark:text-ink-400">
            .txt, .md, or .pdf files. The mentor only uses this while a learner is in this specific lesson.
          </p>

          <div className="mt-4 flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,.pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadMutation.mutate(file);
              }}
              className="text-sm dark:text-ink-400"
            />
            {uploadMutation.isPending ? <Spinner size={20} /> : null}
          </div>
          {uploadMutation.isError ? (
            <p className="mt-2 text-sm text-red-600">Upload failed. Please try again.</p>
          ) : null}

          <div className="mt-4 max-h-64 space-y-2 overflow-y-auto">
            {isLoading ? (
              <Spinner />
            ) : !documents || documents.length === 0 ? (
              <p className="text-sm text-slate-400 dark:text-ink-400">No material uploaded yet.</p>
            ) : (
              documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-ink-700"
                >
                  <span className="text-slate-700 dark:text-ink-100">{doc.source}</span>
                  <Button
                    variant="danger"
                    loading={deleteMutation.isPending && deleteMutation.variables === doc.id}
                    onClick={() => deleteMutation.mutate(doc.id)}
                  >
                    Delete
                  </Button>
                </div>
              ))
            )}
          </div>

          <div className="mt-6 flex justify-end">
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
