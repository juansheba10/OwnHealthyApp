import { Bot, User } from "lucide-react";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
}

export function ChatMessage({ role, content }: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
          isUser ? "bg-accent/10" : "bg-purple/10"
        }`}
      >
        {isUser ? (
          <User size={16} className="text-accent" />
        ) : (
          <Bot size={16} className="text-purple" />
        )}
      </div>
      <div
        className={`max-w-[80%] rounded-xl px-4 py-3 text-sm whitespace-pre-wrap ${
          isUser
            ? "bg-accent/10 text-text"
            : "bg-card border border-border text-text"
        }`}
      >
        {content}
      </div>
    </div>
  );
}
