import type { SelectOption } from "../components/atoms/Select";

// Shared between the Chat header's module selector and the Settings page's
// "Default module" selector (both need the same list; ported as-is from
// the old vanilla app's <select id="agentSelect">).
export const AGENT_OPTIONS: SelectOption[] = [
  { value: "", label: "Auto Router" },
  { value: "English Mentor", label: "English Mentor" },
  { value: "Knowledge Assistant", label: "Knowledge Assistant" },
  { value: "Productivity Assistant", label: "Productivity Assistant" },
  { value: "Primary English Mentor", label: "Primary English Mentor" },
  { value: "Secondary English Mentor", label: "Secondary English Mentor" },
  { value: "College English Mentor", label: "College English Mentor" },
  { value: "Professional English Mentor", label: "Professional English Mentor" },
];
