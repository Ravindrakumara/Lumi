import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { profileApi } from "../../api/profileApi";
import { subscriptionApi } from "../../api/subscriptionApi";
import { voiceApi } from "../../api/voiceApi";
import Badge from "../../components/atoms/Badge";
import Button from "../../components/atoms/Button";
import Card from "../../components/atoms/Card";
import PageHeader from "../../components/atoms/PageHeader";
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

  const chatLimitReached =
    Boolean(subscription) &&
    subscription!.usage_today.chat_messages_limit > 0 &&
    subscription!.usage_today.chat_messages_used >= subscription!.usage_today.chat_messages_limit;

  return (
    <div className="max-w-2xl space-y-5">
      <PageHeader title="Settings" subtitle="Adjust how Lumi teaches you." />

      {subscription ? (
        <Card padding="lg">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-[15px] font-bold text-ink-900 dark:text-ink-100">Subscription</p>
            <span className="rounded-[10px] bg-slate-100 px-2.5 py-1 text-[11px] font-bold uppercase text-slate-500 dark:bg-ink-800 dark:text-ink-400">
              {subscription.tier.name}
            </span>
          </div>

          <div className="mb-3.5">
            <ProgressBar
              label="Chat messages today"
              value={subscription.usage_today.chat_messages_used}
              max={subscription.usage_today.chat_messages_limit}
            />
            {chatLimitReached ? (
              <div className="mt-2 flex flex-col gap-2 rounded-[10px] border border-[#ffd9c7] bg-[#fff5f1] px-3.5 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-[12.5px] text-[#7c2d12]">
                  You've used all {subscription.usage_today.chat_messages_limit} free chat messages for today. Resets
                  at midnight.
                </span>
                <Link
                  to="/choose-plan"
                  className="shrink-0 whitespace-nowrap rounded-lg bg-live-500 px-3.5 py-1.5 text-center text-xs font-bold text-white hover:bg-live-600"
                >
                  Upgrade plan
                </Link>
              </div>
            ) : null}
          </div>

          <ProgressBar
            label="Voice minutes today"
            value={subscription.usage_today.voice_minutes_used}
            max={subscription.usage_today.voice_minutes_limit}
          />

          <div className="mt-3.5 flex items-center justify-between">
            <p className="text-xs text-slate-400 dark:text-ink-400">Limits reset daily.</p>
            <Link to="/billing" className="text-[12.5px] font-semibold text-brand-500 hover:underline">
              View invoices &rarr;
            </Link>
          </div>
        </Card>
      ) : null}

      {profile?.cefr_level ? (
        <Card padding="lg">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-ink-100">English level</p>
              <p className="text-xs text-slate-500 dark:text-ink-400">
                From your adaptive assessment - retake it any time to track your progress.
              </p>
            </div>
            <Badge tone="brand">{profile.cefr_level}</Badge>
          </div>
          <Link to="/assessment" className="mt-3 inline-block">
            <Button variant="secondary">Retake assessment</Button>
          </Link>
        </Card>
      ) : null}

      <Card padding="lg" className="space-y-4">
        <Select label="Default module" value={agentName} onChange={setAgentName} options={AGENT_OPTIONS} />
        <div className="h-px bg-slate-100 dark:bg-ink-800" />
        <Select
          label="Lesson level"
          value={lessonLevel}
          onChange={(value) => setLessonLevel(value, profile?.user_id)}
          options={LEVEL_OPTIONS}
        />
      </Card>

      <Card padding="lg">
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
