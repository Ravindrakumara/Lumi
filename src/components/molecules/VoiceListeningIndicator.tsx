// A hard-to-miss "the AI is hearing you" affordance for voice input -
// modeled on the pulsing-dot + bouncing-dots pattern ChatGPT/Claude voice
// mode uses, so a first-time user recognizes it instantly rather than
// having to infer state from a plain color change on a small button.
export default function VoiceListeningIndicator() {
  return (
    <div className="flex items-center gap-2 rounded-full bg-live-500/10 px-3 py-1.5 text-sm font-medium text-live-600 dark:text-live-500">
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-live-500 opacity-75" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-live-500" />
      </span>
      <span>Listening</span>
      <span className="flex items-end gap-0.5">
        <span className="h-1.5 w-1 animate-bounce rounded-full bg-live-500 [animation-delay:-0.3s]" />
        <span className="h-2 w-1 animate-bounce rounded-full bg-live-500 [animation-delay:-0.15s]" />
        <span className="h-1.5 w-1 animate-bounce rounded-full bg-live-500" />
      </span>
    </div>
  );
}
