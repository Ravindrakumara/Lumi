import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { profileApi } from "../../api/profileApi";
import { subscriptionApi } from "../../api/subscriptionApi";
import { voiceApi } from "../../api/voiceApi";
import Badge from "../../components/atoms/Badge";
import Card from "../../components/atoms/Card";
import Select, { type SelectOption } from "../../components/atoms/Select";
import ProgressBar from "../../components/molecules/ProgressBar";
import VoiceSelector from "../../components/molecules/VoiceSelector";
import { AGENT_OPTIONS } from "../../constants/agents";
import { useSettingsStore } from "../../store/settingsStore";

const LEVEL_OPTIONS: SelectOption[] = [
  { value: "secondary", label: "Secondary" },
  { value: "primary", label: "Primary" },
  { value: "college", label: "College" },
  { value: "professional", label: "Professional" },
];

export default function SettingsPage() {
  const {
    voiceName,
    voiceMode,
    agentName,
    lessonLevel,
    setVoiceName,
    setVoiceMode,
    setAgentName,
    setLessonLevel,
    syncLessonLevelOwner,
  } = useSettingsStore();

  const { data: voices } = useQuery({
    queryKey: ["voices"],
    queryFn: voiceApi.listVoices,
  });

  const { data: subscription } = useQuery({
    queryKey: ["subscription"],
    queryFn: subscriptionApi.getMine,
  });

  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: profileApi.get });

  // Same reconciliation as LessonsPage - keeps the persisted level from
  // leaking in from a different account that logged in earlier in this
  // browser (see settingsStore.ts's syncLessonLevelOwner).
  useEffect(() => {
    if (profile) syncLessonLevelOwner(profile.user_id, profile.program.id);
  }, [profile, syncLessonLevelOwner]);

  return (
    <div className="max-w-xl space-y-4">
      <h2 className="text-xl font-bold text-slate-900 dark:text-ink-100">Settings</h2>
      <p className="text-sm text-slate-500 dark:text-ink-400">Adjust how Lumi teaches you.</p>

      {subscription ? (
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-800 dark:text-ink-100">Subscription</p>
            <Badge tone={subscription.tier.id === "premium" ? "admin" : "neutral"}>
              {subscription.tier.name}
            </Badge>
          </div>
          <div className="space-y-3">
            <ProgressBar
              label="Chat messages today"
              value={subscription.usage_today.chat_messages_used}
              max={subscription.usage_today.chat_messages_limit}
            />
            <ProgressBar
              label="Voice minutes today"
              value={subscription.usage_today.voice_minutes_used}
              max={subscription.usage_today.voice_minutes_limit}
            />
          </div>
          <p className="mt-3 text-xs text-slate-400 dark:text-ink-400">
            Limits reset daily. Contact an admin to change your tier.
          </p>
          <Link to="/billing" className="mt-3 inline-block text-sm font-medium text-live-600 hover:underline dark:text-live-500">
            View invoices &rarr;
          </Link>
        </Card>
      ) : null}

      <Card className="grid gap-4 sm:grid-cols-2">
        <Select label="Default module" value={agentName} onChange={setAgentName} options={AGENT_OPTIONS} />
        <Select
          label="Lesson level"
          value={lessonLevel}
          onChange={(value) => setLessonLevel(value, profile?.user_id)}
          options={LEVEL_OPTIONS}
        />
      </Card>

      <Card>
        <VoiceSelector
          voices={voices || []}
          voiceName={voiceName}
          voiceMode={voiceMode}
          onVoiceChange={setVoiceName}
          onModeChange={setVoiceMode}
        />
      </Card>
    </div>
  );
}
