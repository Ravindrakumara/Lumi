import Select from "../atoms/Select";
import type { Voice, VoiceMode } from "../../types";

const MODE_OPTIONS: { value: VoiceMode; label: string }[] = [
  { value: "auto", label: "Auto (online quality, offline fallback)" },
  { value: "online", label: "Online only (natural neural voice)" },
  { value: "offline", label: "Offline only (works with no internet)" },
];

interface VoiceSelectorProps {
  voices?: Voice[];
  voiceName: string;
  voiceMode: VoiceMode;
  onVoiceChange: (voice: string) => void;
  onModeChange: (mode: VoiceMode) => void;
}

export default function VoiceSelector({
  voices = [],
  voiceName,
  voiceMode,
  onVoiceChange,
  onModeChange,
}: VoiceSelectorProps) {
  const voiceOptions = voices.map((v) => ({ value: v.key, label: `${v.name} — ${v.accent} ${v.gender}` }));

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Select label="Voice (accent / gender)" value={voiceName} onChange={onVoiceChange} options={voiceOptions} />
      <Select
        label="Voice mode"
        value={voiceMode}
        onChange={(value) => onModeChange(value as VoiceMode)}
        options={MODE_OPTIONS}
      />
    </div>
  );
}
