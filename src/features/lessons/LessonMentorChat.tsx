import { useMutation } from "@tanstack/react-query";
import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { chatApi } from "../../api/chatApi";
import Button from "../../components/atoms/Button";
import Input from "../../components/atoms/Input";
import ChatBubble from "../../components/molecules/ChatBubble";
import { useSettingsStore } from "../../store/settingsStore";

interface Message {
  role: "user" | "assistant";
  text: string;
}

/** A separate, lesson-scoped mini-chat - not the same conversation as the
 * general Chat page (useChatSession/chatStore). Every message here sends
 * lesson_id, so the mentor's RAG retrieval stays restricted to whatever
 * material was uploaded against THIS lesson (web/admin_lessons_routes.py),
 * rather than blending in the general knowledge base or answers colored
 * by a different lesson's material. */
export default function LessonMentorChat({ lessonId }: { lessonId: string }) {
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const agentName = useSettingsStore((s) => s.agentName);

  const sendMutation = useMutation({
    mutationFn: (text: string) => chatApi.send(text, `lesson-${lessonId}`, agentName, lessonId),
    onSuccess: (responseText) => {
      setMessages((prev) => [...prev, { role: "assistant", text: responseText }]);
    },
    onError: () => {
      setMessages((prev) => [...prev, { role: "assistant", text: "Sorry, something went wrong. Please try again." }]);
    },
  });

  function send(text: string) {
    if (!text.trim() || sendMutation.isPending) return;
    setMessages((prev) => [...prev, { role: "user", text }]);
    setDraft("");
    sendMutation.mutate(text);
  }

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 text-sm font-medium text-slate-600 hover:border-live-500/40 hover:text-live-600 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-400"
      >
        <ChatBubbleLeftRightIcon className="h-4 w-4" />
        Ask the mentor about this lesson
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 dark:border-ink-700 dark:bg-ink-900">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-ink-400">
          Ask about this lesson
        </span>
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-ink-100"
        >
          Collapse
        </button>
      </div>

      {messages.length > 0 ? (
        <div className="max-h-48 space-y-2 overflow-y-auto">
          {messages.map((m, i) => (
            <ChatBubble key={i} role={m.role} text={m.text} />
          ))}
          {sendMutation.isPending ? <ChatBubble role="assistant" text="Typing… ⏳" /> : null}
        </div>
      ) : (
        <p className="text-xs text-slate-400 dark:text-ink-400">
          Only draws on material uploaded for this specific lesson, if any.
        </p>
      )}

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          send(draft);
        }}
      >
        <Input
          className="flex-1"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ask a question about this lesson…"
        />
        <Button type="submit" loading={sendMutation.isPending} className="px-3">
          Send
        </Button>
      </form>
    </div>
  );
}
