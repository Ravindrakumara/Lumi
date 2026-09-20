import { MicrophoneIcon, SpeakerWaveIcon, XMarkIcon } from "@heroicons/react/24/solid";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../../components/atoms/Button";
import Spinner from "../../components/atoms/Spinner";
import VoiceListeningIndicator from "../../components/molecules/VoiceListeningIndicator";
import { useChatSession } from "../../hooks/useChatSession";
import { useVoiceConversation } from "../../hooks/useVoiceConversation";

const PHASE_LABEL: Record<string, string> = {
  idle: "Tap to start talking",
  listening: "Listening…",
  transcribing: "Thinking about what you said…",
  responding: "Speaking…",
};

/** The full hands-free conversation experience, split out entirely from
 * the typed chat screen (ChatWindow.tsx) - sharing the same underlying
 * conversation via useChatSession/chatStore, but with its own dedicated,
 * distraction-free surface: no typed input box, no quick-action chips,
 * just the live state of the voice loop. Reachable from ChatWindow's
 * "Voice mode" link; the back button returns to the typed chat with the
 * same conversation intact. */
export default function VoiceModePage() {
  const navigate = useNavigate();
  const { messages, quotaExceeded, sendAndWaitForReply } = useChatSession({
    onQuotaExceeded: () => conversation.stopConversation(),
  });

  const [startError, setStartError] = useState<string | null>(null);

  const conversation = useVoiceConversation({
    onUtterance: (transcript) => sendAndWaitForReply(transcript),
    onError: (message) => {
      // Only surface this if it happened while trying to start (mic
      // permission denied, unsupported browser) - a transient blip mid-
      // conversation (a clip that didn't transcribe) doesn't need to
      // interrupt anything, the loop already just keeps listening.
      if (!conversation.isActive) setStartError(message);
    },
  });

  const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
  const lastAssistantMessage = [...messages].reverse().find((m) => m.role === "assistant");

  useEffect(() => {
    if (quotaExceeded) conversation.stopConversation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quotaExceeded]);

  const phase = conversation.isActive ? conversation.phase : "idle";

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-slate-950 px-6 text-white">
      <Link
        to="/"
        className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/70 hover:bg-white/10"
      >
        <XMarkIcon className="h-4 w-4" />
        Back to chat
      </Link>

      <div className="relative flex h-36 w-36 items-center justify-center rounded-full bg-white/5">
        {phase === "listening" ? (
          <>
            <span className="absolute inset-0 animate-ping rounded-full bg-live-500/40" />
            <span className="absolute inset-3 animate-pulse rounded-full bg-live-500/20" />
          </>
        ) : null}
        {phase === "responding" ? <span className="absolute inset-0 animate-pulse rounded-full bg-brand-500/30" /> : null}

        <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-white/10">
          {phase === "transcribing" ? (
            <Spinner size={32} />
          ) : phase === "responding" ? (
            <SpeakerWaveIcon className="h-10 w-10 text-brand-100" />
          ) : (
            <MicrophoneIcon className={`h-10 w-10 ${phase === "listening" ? "text-live-400" : "text-white/60"}`} />
          )}
        </div>
      </div>

      <div className="mt-6">
        {phase === "listening" ? (
          <VoiceListeningIndicator />
        ) : (
          <p className="text-lg font-medium text-white/90">{PHASE_LABEL[phase]}</p>
        )}
      </div>

      <div className="mt-10 max-w-lg space-y-4 text-center">
        {lastUserMessage ? (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-white/40">You said</p>
            <p className="mt-1 text-white/80">{lastUserMessage.text}</p>
          </div>
        ) : null}
        {lastAssistantMessage ? (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-white/40">Mentor</p>
            <p
              className="mt-1 text-white/80"
              dangerouslySetInnerHTML={{ __html: lastAssistantMessage.text }}
            />
          </div>
        ) : null}
      </div>

      {quotaExceeded ? (
        <div className="mt-8 flex items-center gap-3 rounded-lg border border-live-500/30 bg-live-500/10 px-4 py-2 text-sm">
          <span>You've hit today's free limit.</span>
          <Link to="/choose-plan" className="rounded-lg bg-live-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-live-600">
            View plans
          </Link>
        </div>
      ) : !conversation.isSupported ? (
        <p className="mt-8 max-w-sm text-center text-sm text-white/50">
          Voice mode needs microphone access, which this browser doesn't support. Try Chrome, Edge, or type your
          messages instead.
        </p>
      ) : (
        <>
          <Button
            variant={conversation.isActive ? "danger" : "primary"}
            onClick={() => {
              if (conversation.isActive) {
                conversation.stopConversation();
              } else {
                setStartError(null);
                conversation.startConversation();
              }
            }}
            className="mt-10 px-6 py-3"
          >
            {conversation.isActive ? "End conversation" : "Start voice mode"}
          </Button>
          {startError ? <p className="mt-3 max-w-sm text-center text-sm text-red-400">{startError}</p> : null}
        </>
      )}

      <button
        type="button"
        onClick={() => navigate("/")}
        className="mt-6 text-sm text-white/40 hover:text-white/70"
      >
        Prefer typing? Go back to chat
      </button>
    </div>
  );
}
