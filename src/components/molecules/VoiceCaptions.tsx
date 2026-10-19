import type { VoiceConversationPhase } from "../../hooks/useVoiceConversation";

interface VoiceCaptionsProps {
  phase: VoiceConversationPhase;
  /** Exactly what the speech-to-text returned for the last thing said -
   * shown verbatim, mistakes included, so a bad transcription is obvious
   * on screen instead of only surfacing as a strange reply. */
  heard: string | null;
  /** What the assistant is saying back, while it says it. */
  reply: string | null;
}

const PHASE_TEXT: Record<VoiceConversationPhase, string> = {
  idle: "",
  listening: "Listening…",
  transcribing: "Working out what you said…",
  responding: "Lumi is replying…",
};

/** Live captions over the conversation, the way a voice assistant shows
 * them: what it heard and what it is saying, as it happens. Translucent
 * so the chat stays visible underneath, and the text flips with the theme
 * rather than being pinned to one colour. */
export default function VoiceCaptions({ phase, heard, reply }: VoiceCaptionsProps) {
  const status = PHASE_TEXT[phase];
  if (!status && !heard && !reply) return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-col items-center gap-2 p-4">
      {heard ? (
        <div className="max-w-[92%] rounded-2xl border border-white/40 bg-white/75 px-5 py-3 text-center shadow-lg backdrop-blur-md dark:border-white/10 dark:bg-ink-950/75">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-ink-400">
            What we heard
          </p>
          <p className="mt-1 text-[15px] font-semibold leading-snug text-ink-900 dark:text-ink-100">{heard}</p>
        </div>
      ) : null}

      {reply ? (
        <div className="max-w-[92%] rounded-2xl border border-brand-500/25 bg-brand-500/90 px-5 py-3 text-center shadow-lg backdrop-blur-md">
          <p className="text-[10px] font-bold uppercase tracking-wider text-white/70">Lumi</p>
          <p className="mt-1 text-[15px] font-semibold leading-snug text-white">{reply}</p>
        </div>
      ) : null}

      {status ? (
        <span className="rounded-full bg-black/55 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-sm dark:bg-white/15">
          {status}
        </span>
      ) : null}
    </div>
  );
}
