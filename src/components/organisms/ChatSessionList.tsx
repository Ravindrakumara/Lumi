import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PlusIcon, XMarkIcon } from "@heroicons/react/20/solid";
import { useRef } from "react";
import { chatApi } from "../../api/chatApi";
import { useChatStore } from "../../store/chatStore";

/** How long ago the conversation was last used.
 *
 * Deliberately NOT when it started. A conversation carried over from the
 * old JSON memory files began weeks ago but may have been used minutes
 * ago - showing its start date made a chat you were just in read as "14d",
 * which is accurate and useless. Every messaging app shows last activity,
 * and that is how people read this row. */
function lastActive(iso: string | null): string {
  if (!iso) return "";
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  return days === 1 ? "1d" : `${days}d`;
}

/** Past conversations as a row of capsules, plus a way to start a fresh one.
 *
 * The history was always being stored - every turn has gone into Postgres
 * since the chat_messages table replaced the per-session JSON files. What
 * was missing was any way to reach it: every learner was pinned to one
 * conversation called "default", so earlier chats existed but could never
 * be opened again. */
export default function ChatSessionList() {
  const queryClient = useQueryClient();
  const railRef = useRef<HTMLDivElement>(null);
  const openSession = useChatStore((s) => s.openSession);
  const startNewSession = useChatStore((s) => s.startNewSession);
  const currentId = useChatStore((s) => s.sessionId);

  const { data: sessions, isLoading } = useQuery({
    queryKey: ["chat", "sessions"],
    queryFn: chatApi.sessions,
  });

  const openMutation = useMutation({
    mutationFn: async (id: string) => ({ id, messages: await chatApi.sessionMessages(id) }),
    onSuccess: ({ id, messages }) =>
      openSession(
        id,
        messages.map((m) => ({ role: m.role, text: m.content }))
      ),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => chatApi.deleteSession(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["chat", "sessions"] });
      // Deleting the open conversation would otherwise leave the panel
      // showing messages that no longer exist anywhere.
      if (id === currentId) startNewSession();
    },
  });

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => {
          startNewSession();
          queryClient.invalidateQueries({ queryKey: ["chat", "sessions"] });
        }}
        className="flex shrink-0 items-center gap-1 rounded-full bg-brand-500 px-3 py-1.5 text-[12px] font-bold text-white transition-colors hover:bg-brand-600"
      >
        <PlusIcon className="h-3.5 w-3.5" />
        New
      </button>

      <div
        ref={railRef}
        // A trackpad or wheel only produces deltaY over a horizontal rail,
        // so it is translated here - otherwise the row could only be moved
        // by dragging, with no scrollbar to grab either.
        onWheel={(e) => {
          const rail = railRef.current;
          if (!rail || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
          rail.scrollLeft += e.deltaY;
        }}
        className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {isLoading ? (
          <span className="text-[11.5px] text-slate-400 dark:text-ink-400">Loading…</span>
        ) : !sessions?.length ? (
          <span className="text-[11.5px] text-slate-400 dark:text-ink-400">
            Earlier conversations appear here once you send a message.
          </span>
        ) : (
          sessions.map((s) => {
            const isOpen = s.id === currentId;
            return (
              <span
                key={s.id}
                className={`group inline-flex shrink-0 items-center gap-1.5 rounded-full border py-1.5 pl-3 pr-1.5 transition-colors ${
                  isOpen
                    ? "border-brand-500 bg-brand-50 dark:border-live-500 dark:bg-ink-800"
                    : "border-slate-200 bg-white hover:border-brand-200 dark:border-ink-700 dark:bg-ink-900"
                }`}
              >
                <button
                  type="button"
                  onClick={() => openMutation.mutate(s.id)}
                  disabled={openMutation.isPending}
                  title={s.title}
                  className="flex items-baseline gap-1.5"
                >
                  <span
                    className={`max-w-[150px] truncate text-[12px] font-semibold ${
                      isOpen ? "text-brand-700 dark:text-live-500" : "text-ink-900 dark:text-ink-100"
                    }`}
                  >
                    {s.title}
                  </span>
                  <span
                    className="shrink-0 text-[10.5px] font-medium text-slate-400 dark:text-ink-400"
                    title={s.started_at ? `Started ${new Date(s.started_at).toLocaleString()}` : undefined}
                  >
                    {lastActive(s.last_message_at)}
                  </span>
                </button>

                <button
                  type="button"
                  aria-label={`Delete conversation: ${s.title}`}
                  onClick={() => {
                    if (confirm(`Delete this conversation? "${s.title}"`)) deleteMutation.mutate(s.id);
                  }}
                  className="rounded-full p-0.5 text-slate-300 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-500 focus-visible:opacity-100 group-hover:opacity-100 dark:hover:bg-ink-700"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            );
          })
        )}
      </div>
    </div>
  );
}
