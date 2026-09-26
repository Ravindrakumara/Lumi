import { PauseCircleIcon, SpeakerWaveIcon } from "@heroicons/react/24/solid";
import Avatar from "../atoms/Avatar";
import Orb from "../atoms/Orb";

interface ChatBubbleProps {
  role: "user" | "assistant";
  text: string;
  userName?: string;
  /** Renders a speaker control under the bubble. Only passed in text
   * mode: in voice mode the reply is already being spoken aloud. */
  onSpeak?: (text: string) => void;
  onStopSpeaking?: () => void;
  /** True while THIS bubble is the one being read out. */
  isSpeaking?: boolean;
}

/** The model answers in Markdown, so without this the bubbles showed raw
 * `**asterisks**` on screen. Escapes first and only then re-introduces the
 * handful of tags we actually want, so model/user text can never inject
 * markup of its own. */
function renderMarkdown(text: string): string {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

  return escaped
    .replace(/`([^`\n]+)`/g, '<code class="rounded bg-black/5 px-1 py-0.5 text-[0.9em]">$1</code>')
    .replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[\s(])\*([^*\n]+)\*/g, "$1<em>$2</em>")
    .replace(/\n/g, "<br/>");
}

export default function ChatBubble({
  role,
  text,
  userName = "You",
  onSpeak,
  onStopSpeaking,
  isSpeaking = false,
}: ChatBubbleProps) {
  const isUser = role === "user";

  return (
    <div className={`flex items-end gap-2.5 ${isUser ? "flex-row-reverse" : ""}`}>
      {isUser ? <Avatar name={userName} size={30} /> : <Orb size={30} />}
      <div className={`flex max-w-[75%] flex-col ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`rounded-2xl px-4 py-[13px] text-sm leading-relaxed
            ${
              isUser
                ? "rounded-br-sm bg-brand-500 text-white"
                : "rounded-bl-sm border border-slate-200 bg-white text-ink-900 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-100"
            }`}
          dangerouslySetInnerHTML={{ __html: renderMarkdown(text) }}
        />
        {onSpeak ? (
          <button
            type="button"
            onClick={() => (isSpeaking ? onStopSpeaking?.() : onSpeak(text))}
            aria-label={isSpeaking ? "Stop reading this message" : "Read this message aloud"}
            className={`mt-1 flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold transition-colors
              ${
                isSpeaking
                  ? "bg-live-500/10 text-live-600 dark:text-live-500"
                  : "text-slate-400 hover:bg-slate-100 hover:text-brand-600 dark:text-ink-400 dark:hover:bg-ink-800"
              }`}
          >
            {isSpeaking ? (
              <>
                <PauseCircleIcon className="h-3.5 w-3.5" />
                Stop
              </>
            ) : (
              <>
                <SpeakerWaveIcon className="h-3.5 w-3.5" />
                Listen
              </>
            )}
          </button>
        ) : null}
      </div>
    </div>
  );
}
