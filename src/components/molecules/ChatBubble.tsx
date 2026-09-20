import Avatar from "../atoms/Avatar";

interface ChatBubbleProps {
  role: "user" | "assistant";
  text: string;
  userName?: string;
}

export default function ChatBubble({ role, text, userName = "You" }: ChatBubbleProps) {
  const isUser = role === "user";
  return (
    <div className={`flex items-end gap-2 ${isUser ? "flex-row-reverse" : ""}`}>
      <Avatar name={isUser ? userName : "AI"} size={28} />
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm leading-relaxed
          ${isUser ? "rounded-br-sm bg-brand-500 text-white" : "rounded-bl-sm bg-white text-slate-800 shadow-sm"}`}
        dangerouslySetInnerHTML={{ __html: text }}
      />
    </div>
  );
}
