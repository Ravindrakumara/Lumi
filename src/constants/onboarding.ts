import type { SelectOption } from "../components/atoms/Select";

// Predefined, tap-to-select instead of typed - faster for onboarding and
// keeps answers to a known set the backend/analytics can act on later.
export const GOAL_OPTIONS: string[] = [
  "Everyday conversation",
  "Improve speaking",
  "Improve writing",
  "Build vocabulary",
  "Grammar accuracy",
  "Listening comprehension",
  "Prepare for an exam",
  "Workplace English",
  "Interview practice",
  "Confidence speaking in public",
];

export const NATIVE_LANGUAGE_OPTIONS: SelectOption[] = [
  { value: "Tamil", label: "Tamil" },
  { value: "Sinhala", label: "Sinhala" },
  { value: "Hindi", label: "Hindi" },
  { value: "Telugu", label: "Telugu" },
  { value: "Malayalam", label: "Malayalam" },
  { value: "Kannada", label: "Kannada" },
  { value: "Bengali", label: "Bengali" },
  { value: "Urdu", label: "Urdu" },
  { value: "Arabic", label: "Arabic" },
  { value: "Mandarin Chinese", label: "Mandarin Chinese" },
  { value: "Spanish", label: "Spanish" },
  { value: "French", label: "French" },
  { value: "Other", label: "Other" },
];
