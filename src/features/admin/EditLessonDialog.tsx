import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { useEffect, useState } from "react";
import { adminLessonsApi, type AdminLessonSummary } from "../../api/adminLessonsApi";
import Button from "../../components/atoms/Button";
import FormField from "../../components/molecules/FormField";
import Select from "../../components/atoms/Select";
import TextArea from "../../components/atoms/TextArea";

interface EditLessonDialogProps {
  lesson: AdminLessonSummary | null;
  onClose: () => void;
}

const CEFR_OPTIONS = [
  { value: "", label: "Any level (untagged)" },
  { value: "A1", label: "A1 - Beginner" },
  { value: "A2", label: "A2 - Elementary" },
  { value: "B1", label: "B1 - Intermediate" },
  { value: "B2", label: "B2 - Upper intermediate" },
  { value: "C1", label: "C1 - Advanced" },
  { value: "C2", label: "C2 - Proficient" },
];

export default function EditLessonDialog({ lesson, onClose }: EditLessonDialogProps) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [introduction, setIntroduction] = useState("");
  const [topic, setTopic] = useState("");
  const [cefrLevel, setCefrLevel] = useState("");
  const [sequence, setSequence] = useState("");
  const [difficulty, setDifficulty] = useState("1");
  const [durationMinutes, setDurationMinutes] = useState("30");

  // Re-fill whenever a different lesson is opened. Without this the dialog
  // would keep the previously edited lesson's values and silently save them
  // onto the new one.
  useEffect(() => {
    if (!lesson) return;
    setTitle(lesson.title);
    setDescription(lesson.description);
    setIntroduction(lesson.introduction ?? "");
    setTopic(lesson.topic);
    setCefrLevel(lesson.cefr_level ?? "");
    setSequence(lesson.sequence == null ? "" : String(lesson.sequence));
    setDifficulty(String(lesson.difficulty));
    setDurationMinutes(String(lesson.duration_minutes));
  }, [lesson]);

  const updateMutation = useMutation<unknown, AxiosError<{ detail: string }>, void>({
    mutationFn: () =>
      adminLessonsApi.update(lesson!.id, {
        title,
        description,
        introduction,
        topic,
        cefr_level: cefrLevel,
        sequence,
        difficulty: Number(difficulty),
        duration_minutes: Number(durationMinutes),
      }),
    onSuccess: () => {
      // The learner-facing catalogue reads the same rows, so both caches
      // have to drop - otherwise an edit is invisible until a reload.
      queryClient.invalidateQueries({ queryKey: ["admin", "lessons"] });
      queryClient.invalidateQueries({ queryKey: ["lessons"] });
      onClose();
    },
  });

  return (
    <Dialog open={lesson !== null} onClose={onClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-black/40" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-2xl bg-white p-6 shadow-xl dark:bg-ink-900">
          <DialogTitle className="text-lg font-bold text-slate-900 dark:text-ink-100">
            Edit lesson
          </DialogTitle>
          <p className="text-sm text-slate-500 dark:text-ink-400">
            Editing <b>{lesson?.id}</b>. Exercises aren't editable here yet — use
            "Manage material" to add study material the mentor can draw on.
          </p>

          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              updateMutation.mutate();
            }}
          >
            <FormField label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />

            <div>
              <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-ink-100">Description</span>
              <TextArea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} required />
            </div>

            <div>
              <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-ink-100">
                Introduction (shown to learners)
              </span>
              <TextArea value={introduction} onChange={(e) => setIntroduction(e.target.value)} rows={4} />
            </div>

            <Select label="Required CEFR level" value={cefrLevel} onChange={setCefrLevel} options={CEFR_OPTIONS} />

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Topic" value={topic} onChange={(e) => setTopic(e.target.value)} required />
              <FormField
                label="Sequence"
                type="number"
                value={sequence}
                placeholder="blank = not in the order"
                onChange={(e) => setSequence(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField
                label="Difficulty (1-5)"
                type="number"
                min={1}
                max={5}
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
              />
              <FormField
                label="Duration (min)"
                type="number"
                min={5}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
              />
            </div>

            {updateMutation.error ? (
              <p className="text-sm text-red-600">{updateMutation.error.response?.data?.detail}</p>
            ) : null}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" loading={updateMutation.isPending}>
                Save changes
              </Button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
