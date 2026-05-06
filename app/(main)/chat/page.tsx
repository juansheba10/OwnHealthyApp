"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Bot } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { ConfirmCard } from "@/components/chat/ConfirmCard";

type Message =
  | { kind: "text"; role: "user" | "assistant"; content: string }
  | {
      kind: "confirm";
      title: string;
      summary: string;
      resolved: "approved" | "rejected";
    };

interface PendingConfirmation {
  toolName: string;
  title: string;
  summary: string;
  state: unknown;
}

interface ApiResponse {
  reply?: string;
  pendingConfirmation?: {
    toolName: string;
    title: string;
    summary: string;
    assistantText?: string;
  };
  state?: unknown;
}

export default function ChatPage() {
  return (
    <Suspense fallback={null}>
      <ChatPageInner />
    </Suspense>
  );
}

function ChatPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [pending, setPending] = useState<PendingConfirmation | null>(null);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const prefillSent = useRef(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id);
    });
  }, []);

  useEffect(() => {
    if (prefillSent.current || !userId) return;
    const prefill = searchParams.get("prefill");
    if (!prefill) return;
    prefillSent.current = true;
    router.replace("/chat");
    handleSend(prefill);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, searchParams]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pending, loading]);

  function applyApiResponse(data: ApiResponse, base: Message[]): Message[] {
    if (data.pendingConfirmation) {
      const next = [...base];
      if (data.pendingConfirmation.assistantText) {
        next.push({
          kind: "text",
          role: "assistant",
          content: data.pendingConfirmation.assistantText,
        });
      }
      setPending({
        toolName: data.pendingConfirmation.toolName,
        title: data.pendingConfirmation.title,
        summary: data.pendingConfirmation.summary,
        state: data.state,
      });
      return next;
    }
    setPending(null);
    if (data.reply !== undefined) {
      return [
        ...base,
        { kind: "text", role: "assistant", content: data.reply },
      ];
    }
    return base;
  }

  async function handleSend(text: string) {
    if (!userId || pending || loading) return;

    const next: Message[] = [
      ...messages,
      { kind: "text", role: "user", content: text },
    ];
    setMessages(next);
    setLoading(true);

    try {
      const payload = next
        .filter((m): m is Extract<Message, { kind: "text" }> => m.kind === "text")
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: payload, userId }),
      });
      if (!res.ok) throw new Error("Error del servidor");
      const data: ApiResponse = await res.json();
      setMessages(applyApiResponse(data, next));
    } catch {
      setMessages([
        ...next,
        {
          kind: "text",
          role: "assistant",
          content:
            "Lo siento, hubo un error procesando tu mensaje. Inténtalo de nuevo.",
        },
      ]);
      setPending(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm(approved: boolean) {
    if (!pending || !userId || loading) return;

    const resolvedCard: Message = {
      kind: "confirm",
      title: pending.title,
      summary: pending.summary,
      resolved: approved ? "approved" : "rejected",
    };
    const next = [...messages, resolvedCard];
    const opaqueState = pending.state;
    setMessages(next);
    setPending(null);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          state: opaqueState,
          approval: { approved },
        }),
      });
      if (!res.ok) throw new Error("Error del servidor");
      const data: ApiResponse = await res.json();
      setMessages(applyApiResponse(data, next));
    } catch {
      setMessages([
        ...next,
        {
          kind: "text",
          role: "assistant",
          content: "Lo siento, hubo un error procesando la confirmación.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const showSuggestions = messages.length === 0 && !pending && !loading;

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-3rem)]">
      <div className="shrink-0 pb-4">
        <h1 className="font-display text-4xl uppercase tracking-wide">
          Chat IA
        </h1>
        <p className="text-xs text-muted mt-1">
          Pregúntame sobre tu plan, progreso o nutrición
        </p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {showSuggestions && (
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

        {messages.map((msg, i) => {
          if (msg.kind === "text") {
            return (
              <ChatMessage key={i} role={msg.role} content={msg.content} />
            );
          }
          return (
            <ConfirmCard
              key={i}
              title={msg.title}
              summary={msg.summary}
              onApprove={() => {}}
              onReject={() => {}}
              resolved={msg.resolved}
            />
          );
        })}

        {pending && (
          <ConfirmCard
            title={pending.title}
            summary={pending.summary}
            onApprove={() => handleConfirm(true)}
            onReject={() => handleConfirm(false)}
            disabled={loading}
          />
        )}

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

      <div className="shrink-0 pt-2">
        <ChatInput onSend={handleSend} disabled={loading || pending !== null} />
      </div>
    </div>
  );
}
