import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { profileApi } from "../../api/profileApi";
import Button from "../../components/atoms/Button";
import Select from "../../components/atoms/Select";
import FormField from "../../components/molecules/FormField";
import PillMultiSelect from "../../components/molecules/PillMultiSelect";
import { GOAL_OPTIONS, NATIVE_LANGUAGE_OPTIONS } from "../../constants/onboarding";

// Matches the backend's enforced minimum (profiles.age CHECK constraint)
// - roughly the age a child can meaningfully engage with structured
// language learning, not just speak at all. Not a decorative HTML hint:
// checked for real before submit, below.
const MIN_AGE = 5;
const MAX_AGE = 120;

export default function OnboardingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [age, setAge] = useState("");
  const [nativeLanguage, setNativeLanguage] = useState("");
  const [goals, setGoals] = useState<string[]>([]);
  const [ageError, setAgeError] = useState("");

  // Program is deliberately never asked here - age is a weak proxy for
  // level (a 13 year old can already be advanced), so the backend derives
  // a starting Program from age itself (see web/profile_routes.py's
  // recommend_program()). The user can always change it in Settings.
  const submitMutation = useMutation({
    mutationFn: () =>
      profileApi.update({
        age: age ? Number(age) : undefined,
        native_language: nativeLanguage || undefined,
        learning_goals: goals,
        onboarding_completed: true,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      navigate("/", { replace: true });
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (age) {
      const value = Number(age);
      if (!Number.isInteger(value) || value < MIN_AGE || value > MAX_AGE) {
        setAgeError(`Please enter an age between ${MIN_AGE} and ${MAX_AGE}.`);
        return;
      }
    }
    setAgeError("");
    submitMutation.mutate();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 dark:bg-ink-950">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-5 rounded-2xl bg-white p-8 shadow-lg dark:bg-ink-900"
      >
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-ink-100">A few quick things</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-ink-400">
            Helps Lumi pick the right starting point for you. Nothing here is required.
          </p>
        </div>

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

        <div>
          <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-ink-100">
            What do you want to work on?
          </span>
          <PillMultiSelect options={GOAL_OPTIONS} value={goals} onChange={setGoals} />
        </div>

        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            className="text-sm text-slate-500 hover:underline dark:text-ink-400"
            onClick={() => submitMutation.mutate()}
          >
            Skip for now
          </button>
          <Button type="submit" loading={submitMutation.isPending}>
            Continue
          </Button>
        </div>
      </form>
    </div>
  );
}
