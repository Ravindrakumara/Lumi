import ChatWindow from "../../components/organisms/ChatWindow";
import Select from "../../components/atoms/Select";
import { AGENT_OPTIONS } from "../../constants/agents";
import { useAuth } from "../../hooks/useAuth";
import { useSettingsStore } from "../../store/settingsStore";

export default function ChatPage() {
  const { user } = useAuth();
  const { agentName, setAgentName } = useSettingsStore();
  const firstName = user?.name?.split(" ")[0] || "there";

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-lg font-semibold text-slate-900">Hello, {firstName}! 👋</p>
          <p className="text-sm text-slate-500">Let's practice and improve your English together.</p>
        </div>
        <div className="w-56 shrink-0">
          <Select label="Module" value={agentName} onChange={setAgentName} options={AGENT_OPTIONS} />
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <ChatWindow />
      </div>
    </div>
  );
}
