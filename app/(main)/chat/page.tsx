"use client";

import { useEffect, useRef, useState } from "react";
import { Bot } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id);
    });
  }, [supabase.auth]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(text: string) {
    if (!userId) return;

    const userMessage: Message = { role: "user", content: text };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          userId,
        }),
      });

      if (!res.ok) {
        throw new Error("Error del servidor");
      }

      const data = await res.json();
      setMessages([...newMessages, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: "Lo siento, hubo un error procesando tu mensaje. Inténtalo de nuevo.",
        },
      ]);
    }

    setLoading(false);
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-3rem)]">
      {/* Header */}
      <div className="shrink-0 pb-4">
        <h1 className="font-display text-4xl uppercase tracking-wide">
          Chat IA
        </h1>
        <p className="text-xs text-muted mt-1">
          Pregúntame sobre tu plan, progreso o nutrición
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted">
            <div className="w-12 h-12 rounded-full bg-purple/10 flex items-center justify-center mb-3">
              <Bot size={24} className="text-purple" />
            </div>
            <p className="text-sm">Soy tu asistente nutricional.</p>
            <p className="text-xs mt-1">
              Puedo analizar tu progreso, sugerir cambios en tu plan, o responder dudas.
            </p>
            <div className="flex flex-wrap gap-2 mt-4 justify-center">
              {[
                "¿Cómo voy con mi peso?",
                "¿Qué debería cenar hoy?",
                "Analiza mi progreso",
                "Sugiere una receta alta en proteína",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSend(suggestion)}
                  className="rounded-full border border-border px-3 py-1.5 text-xs text-muted hover:text-text hover:border-accent transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <ChatMessage key={i} role={msg.role} content={msg.content} />
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-purple/10 flex items-center justify-center shrink-0">
              <Bot size={16} className="text-purple" />
            </div>
            <div className="bg-card border border-border rounded-xl px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-muted rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-muted rounded-full animate-bounce [animation-delay:0.1s]" />
                <span className="w-2 h-2 bg-muted rounded-full animate-bounce [animation-delay:0.2s]" />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 pt-2">
        <ChatInput onSend={handleSend} disabled={loading} />
      </div>
    </div>
  );
}
