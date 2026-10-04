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

// The unlock axis tied to the Adaptive Assessment Engine's result: a
// learner measured below this band cannot open the lesson yet. "Any level"
// leaves it untagged, which is how every existing lesson behaves.
const CEFR_OPTIONS = [
  { value: "", label: "Any level (untagged)" },
  { value: "A1", label: "A1 - Beginner" },
  { value: "A2", label: "A2 - Elementary" },
  { value: "B1", label: "B1 - Intermediate" },
  { value: "B2", label: "B2 - Upper intermediate" },
  { value: "C1", label: "C1 - Advanced" },
  { value: "C2", label: "C2 - Proficient" },
];

export default function CreateLessonDialog({ open, onClose }: CreateLessonDialogProps) {
  const queryClient = useQueryClient();
  const [id, setId] = useState("");
  const level: LessonLevel = "secondary";
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("1");
  const [durationMinutes, setDurationMinutes] = useState("30");
  const [introduction, setIntroduction] = useState("");
  const [cefrLevel, setCefrLevel] = useState("");
  const [sequence, setSequence] = useState("");

  function reset() {
    setId("");
    setTitle("");
    setDescription("");
    setTopic("");
    setDifficulty("1");
    setDurationMinutes("30");
    setIntroduction("");
    setCefrLevel("");
    setSequence("");
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
        cefr_level: cefrLevel,
        sequence: sequence,
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
            <FormField
              label="Lesson ID"
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="e.g. a1_13"
              required
            />

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

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Topic" value={topic} onChange={(e) => setTopic(e.target.value)} required />
              <Select
                label="Required CEFR level"
                value={cefrLevel}
                onChange={setCefrLevel}
                options={CEFR_OPTIONS}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <FormField
                label="Sequence"
                type="number"
                value={sequence}
                placeholder="e.g. 113"
                onChange={(e) => setSequence(e.target.value)}
              />
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

            <p className="-mt-2 text-xs text-slate-500 dark:text-ink-400">
              Sequence is the curriculum position that decides which lesson a
              learner is handed next. Numbered in hundreds per band
              (A1&nbsp;=&nbsp;101…, A2&nbsp;=&nbsp;201…) so a lesson can be slotted
              between two others. Leave it blank to keep the lesson out of the
              running order.
            </p>

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
