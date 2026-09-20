import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { useState } from "react";
import { adminLessonsApi } from "../../api/adminLessonsApi";
import Button from "../../components/atoms/Button";
import FormField from "../../components/molecules/FormField";
import Select from "../../components/atoms/Select";
import TextArea from "../../components/atoms/TextArea";
import type { LessonLevel } from "../../types";

interface CreateLessonDialogProps {
  open: boolean;
  onClose: () => void;
}

const LEVEL_OPTIONS = [
  { value: "primary", label: "Primary" },
  { value: "secondary", label: "Secondary" },
  { value: "college", label: "College" },
  { value: "professional", label: "Professional" },
];

export default function CreateLessonDialog({ open, onClose }: CreateLessonDialogProps) {
  const queryClient = useQueryClient();
  const [id, setId] = useState("");
  const [level, setLevel] = useState<LessonLevel>("secondary");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("1");
  const [durationMinutes, setDurationMinutes] = useState("30");
  const [introduction, setIntroduction] = useState("");

  function reset() {
    setId("");
    setLevel("secondary");
    setTitle("");
    setDescription("");
    setTopic("");
    setDifficulty("1");
    setDurationMinutes("30");
    setIntroduction("");
  }

  const createMutation = useMutation<unknown, AxiosError<{ detail: string }>, void>({
    mutationFn: () =>
      adminLessonsApi.create({
        id,
        level,
        title,
        description,
        topic,
        difficulty: Number(difficulty),
        duration_minutes: Number(durationMinutes),
        introduction,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "lessons"] });
      reset();
      onClose();
    },
  });

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-black/40" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-lg space-y-4 rounded-2xl bg-white p-6 shadow-xl dark:bg-ink-900">
          <DialogTitle className="text-lg font-bold text-slate-900 dark:text-ink-100">Create lesson</DialogTitle>
          <p className="text-sm text-slate-500 dark:text-ink-400">
            Exercises aren't editable here yet - a new lesson starts with none. Upload study material for it
            afterward from the lesson's own "Manage material" button.
          </p>

          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              createMutation.mutate();
            }}
          >
            <div className="grid grid-cols-2 gap-3">
              <FormField
                label="Lesson ID"
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="e.g. prof_003"
                required
              />
              <Select label="Level" value={level} onChange={(v) => setLevel(v as LessonLevel)} options={LEVEL_OPTIONS} />
            </div>

            <FormField label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />

            <div>
              <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-ink-100">Description</span>
              <TextArea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} required />
            </div>

            <div>
              <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-ink-100">
                Introduction (shown to learners)
              </span>
              <TextArea value={introduction} onChange={(e) => setIntroduction(e.target.value)} rows={3} />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <FormField label="Topic" value={topic} onChange={(e) => setTopic(e.target.value)} required />
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

            {createMutation.error ? (
              <p className="text-sm text-red-600">{createMutation.error.response?.data?.detail}</p>
            ) : null}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" loading={createMutation.isPending}>
                Create
              </Button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
