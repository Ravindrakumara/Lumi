import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { accountApi } from "../../api/accountApi";
import { profileApi } from "../../api/profileApi";
import Badge from "../../components/atoms/Badge";
import Button from "../../components/atoms/Button";
import Card from "../../components/atoms/Card";
import PageHeader from "../../components/atoms/PageHeader";
import Select from "../../components/atoms/Select";
import Spinner from "../../components/atoms/Spinner";
import ConfirmDialog from "../../components/organisms/ConfirmDialog";
import FormField from "../../components/molecules/FormField";
import PillMultiSelect from "../../components/molecules/PillMultiSelect";
import { GOAL_OPTIONS, NATIVE_LANGUAGE_OPTIONS } from "../../constants/onboarding";
import { useAuth } from "../../hooks/useAuth";

const MIN_AGE = 5;
const MAX_AGE = 120;

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 py-2.5 text-sm last:border-0 dark:border-ink-800">
      <span className="text-slate-500 dark:text-ink-400">{label}</span>
      <span className="font-medium text-slate-900 dark:text-ink-100">{value}</span>
    </div>
  );
}

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  // Same queryKey LearnerLayout uses for the onboarding gate - shares the
  // cache, so opening this page costs no extra request in the common case.
  const { data: profile, isLoading } = useQuery({ queryKey: ["profile"], queryFn: profileApi.get });
  const { data: programs } = useQuery({ queryKey: ["programs"], queryFn: profileApi.listPrograms });

  const [isEditing, setIsEditing] = useState(false);
  const [age, setAge] = useState("");
  const [nativeLanguage, setNativeLanguage] = useState("");
  const [programId, setProgramId] = useState("");
  const [goals, setGoals] = useState<string[]>([]);
  const [ageError, setAgeError] = useState("");

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletionScheduledAt, setDeletionScheduledAt] = useState<string | null>(null);

  function startEditing() {
    if (!profile) return;
    setAge(profile.age != null ? String(profile.age) : "");
    setNativeLanguage(profile.native_language || "");
    setProgramId(profile.program.id);
    setGoals(profile.learning_goals);
    setAgeError("");
    setIsEditing(true);
  }

  const saveMutation = useMutation({
    mutationFn: () =>
      profileApi.update({
        age: age ? Number(age) : undefined,
        native_language: nativeLanguage || undefined,
        program_id: programId || undefined,
        learning_goals: goals,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      setIsEditing(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: accountApi.scheduleDeletion,
    onSuccess: (data) => {
      setDeleteDialogOpen(false);
      setDeletionScheduledAt(data.deletion_scheduled_at);
    },
  });

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (age) {
      const value = Number(age);
      if (!Number.isInteger(value) || value < MIN_AGE || value > MAX_AGE) {
        setAgeError(`Please enter an age between ${MIN_AGE} and ${MAX_AGE}.`);
        return;
      }
    }
    setAgeError("");
    saveMutation.mutate();
  }

  if (isLoading) return <Spinner />;
  if (!profile) return null;

  const displayName = [profile.first_name, profile.last_name].filter(Boolean).join(" ") || user?.name;
  const programOptions = (programs || []).map((p) => ({ value: p.id, label: p.name }));

  if (deletionScheduledAt) {
    const when = new Date(deletionScheduledAt).toLocaleString();
    return (
      <div className="max-w-lg rounded-xl border border-red-200 bg-red-50 p-6 dark:border-red-500/20 dark:bg-red-500/10">
        <h2 className="mb-2 text-lg font-bold text-red-800 dark:text-red-400">Account scheduled for deletion</h2>
        <p className="mb-4 text-sm text-red-700 dark:text-red-300">
          Your account will be permanently deleted on <strong>{when}</strong>. Log back in any time before
          then to cancel this automatically.
        </p>
        <Button variant="danger" onClick={logout}>
          Log out now
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-5">
      <PageHeader
        title="Your profile"
        subtitle="Your details, goals, and learning totals."
        action={isEditing ? null : <Button onClick={startEditing}>Edit</Button>}
      />

      {isEditing ? (
        <form
          onSubmit={handleSave}
          className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-ink-700 dark:bg-ink-900 dark:shadow-none"
        >
          <FormField
            label="Age"
            type="number"
            min={MIN_AGE}
            max={MAX_AGE}
            value={age}
            onChange={(e) => {
              setAge(e.target.value);
              if (ageError) setAgeError("");
            }}
            error={ageError}
          />
          <Select
            label="Native language"
            value={nativeLanguage}
            onChange={setNativeLanguage}
            options={[{ value: "", label: "Select..." }, ...NATIVE_LANGUAGE_OPTIONS]}
          />
          {programOptions.length ? (
            <Select label="Program" value={programId} onChange={setProgramId} options={programOptions} />
          ) : null}
          <div>
            <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-ink-100">
              Learning goals
            </span>
            <PillMultiSelect options={GOAL_OPTIONS} value={goals} onChange={setGoals} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saveMutation.isPending}>
              Save
            </Button>
          </div>
        </form>
      ) : (
        <>
          <Card>
            <InfoRow label="Name" value={displayName || "—"} />
            <InfoRow label="Email" value={user?.email || "—"} />
            <InfoRow label="Age" value={profile.age != null ? String(profile.age) : "Not set"} />
            <InfoRow label="Native language" value={profile.native_language || "Not set"} />
            <InfoRow label="Program" value={`${profile.program.name} — ${profile.program.goal}`} />
            <InfoRow label="Preferred voice" value={profile.preferred_voice} />
          </Card>

          <Card>
            <p className="mb-3 text-sm font-semibold text-slate-800 dark:text-ink-100">Learning goals</p>
            {profile.learning_goals.length ? (
              <div className="flex flex-wrap gap-2">
                {profile.learning_goals.map((goal) => (
                  <Badge key={goal} tone="brand">
                    {goal}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 dark:text-ink-400">No goals set yet.</p>
            )}
          </Card>

          <div className="grid grid-cols-3 gap-3">
            {(
              [
                ["Exercises", profile.total_exercises_completed],
                ["Sessions", profile.total_sessions],
                ["Hours", profile.total_learning_hours.toFixed(1)],
              ] as [string, string | number][]
            ).map(([label, value]) => (
              <div
                key={label}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-center dark:border-ink-700 dark:bg-ink-900"
              >
                <p className="font-display text-[22px] font-extrabold text-ink-900 dark:text-ink-100">{value}</p>
                <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-ink-400">
                  {label}
                </p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-red-200 bg-red-50/50 p-4 dark:border-red-500/20 dark:bg-red-500/5">
            <p className="mb-1 text-sm font-semibold text-red-800 dark:text-red-400">Danger zone</p>
            <p className="mb-3 text-xs text-red-600 dark:text-red-300">
              Deletes your login, profile, and all learning history. There's a 24-hour grace period -
              logging back in cancels it.
            </p>
            <Button variant="danger" onClick={() => setDeleteDialogOpen(true)}>
              Delete account
            </Button>
          </div>
        </>
      )}

      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={() => deleteMutation.mutate()}
        title="Delete your account?"
        confirmLabel="Delete account"
        confirmPending={deleteMutation.isPending}
      >
        This schedules your account for permanent deletion in 24 hours - your login, profile, and all
        learning history will be gone. Logging back in before then cancels it.
      </ConfirmDialog>
    </div>
  );
}
