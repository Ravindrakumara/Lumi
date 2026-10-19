import type { SelectOption } from "../components/atoms/Select";

// Shared between the Chat header's module selector and the Settings page's
// "Default module" selector.
//
// Only the four level mentors ship right now - this list must stay in step
// with LAUNCHED_AGENT_NAMES in domain/agents/registry.py on the backend,
// which is what actually enforces it. "Auto Router" (the old "" value) is
// gone along with the general agents it routed to: with only level mentors
// left there is nothing to route between, and the level itself is what
// picks the mentor.
export const AGENT_OPTIONS: SelectOption[] = [
  { value: "Primary English Mentor", label: "Primary English Mentor" },
  { value: "Secondary English Mentor", label: "Secondary English Mentor" },
  { value: "College English Mentor", label: "College English Mentor" },
  { value: "Professional English Mentor", label: "Professional English Mentor" },
];

// Matches DEFAULT_AGENT_NAME in domain/agents/registry.py.
export const DEFAULT_AGENT = "Secondary English Mentor";

// A persisted selection can name an agent that no longer ships - the store
// keeps whatever was chosen before, including "" (Auto Router). Resolve it
// here so a stale value shows, and sends, something that still exists.
export function resolveAgent(agentName: string): string {
  return AGENT_OPTIONS.some((o) => o.value === agentName) ? agentName : DEFAULT_AGENT;
}
