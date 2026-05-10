"use client";

import { useEffect, useState, useTransition } from "react";
import { Timer, Play, Square } from "lucide-react";
import { startFast, stopFast } from "@/app/(main)/fasting/actions";
import {
  fastHoursForProtocol,
  type FastingSession,
} from "@/app/(main)/fasting/lib";

interface FastingTimerProps {
  initialSession: FastingSession | null;
  protocol: string | null;
}

function formatHMS(ms: number): string {
  const sign = ms < 0 ? "-" : "";
  const totalSec = Math.floor(Math.abs(ms) / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${sign}${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function FastingTimer({ initialSession, protocol }: FastingTimerProps) {
  const [session, setSession] = useState<FastingSession | null>(initialSession);
  // Seed `now` from the session start so SSR and first client render produce the
  // same pct (0%). The effect bumps it to the real current time after mount.
  const [now, setNow] = useState(() =>
    initialSession ? new Date(initialSession.started_at).getTime() : 0,
  );
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    const initial = setTimeout(() => setNow(Date.now()), 0);
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      clearTimeout(initial);
      clearInterval(id);
    };
  }, [session]);

  const protocolLabel = protocol ?? `${fastHoursForProtocol(protocol)}:?`;

  function handleStart() {
    setError(null);
    startTransition(async () => {
      try {
        const next = await startFast();
        setSession(next);
        setNow(Date.now());
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error");
      }
    });
  }

  function handleStop() {
    setError(null);
    startTransition(async () => {
      try {
        await stopFast();
        setSession(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error");
      }
    });
  }

  if (!session) {
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs text-muted uppercase tracking-wider flex items-center gap-2">
            <Timer size={14} className="text-purple" />
            Ayuno
            <span className="text-muted/70">· {protocolLabel}</span>
          </h3>
        </div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted">No hay ayuno activo</p>
          <button
            onClick={handleStart}
            disabled={isPending}
            className="flex items-center gap-2 rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-bg disabled:opacity-50"
          >
            <Play size={14} />
            Empezar ayuno
          </button>
        </div>
        {error && <p className="mt-2 text-xs text-pink">{error}</p>}
      </div>
    );
  }

  const startedAt = new Date(session.started_at).getTime();
  const targetEnd = new Date(session.target_end_at).getTime();
  const totalMs = targetEnd - startedAt;
  const elapsedMs = now - startedAt;
  const remainingMs = targetEnd - now;
  const pct = Math.max(0, Math.min(100, (elapsedMs / totalMs) * 100));
  const isComplete = remainingMs <= 0;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs text-muted uppercase tracking-wider flex items-center gap-2">
          <Timer size={14} className={isComplete ? "text-accent" : "text-purple"} />
          Ayuno en curso
          <span className="text-muted/70">· {session.protocol ?? protocolLabel}</span>
        </h3>
        <button
          onClick={handleStop}
          disabled={isPending}
          className="flex items-center gap-1.5 rounded-lg border border-pink/30 px-2.5 py-1.5 text-xs text-pink hover:bg-pink/10 transition-colors disabled:opacity-50"
        >
          <Square size={12} />
          Romper
        </button>
      </div>

      <div className="flex items-baseline justify-between mb-2">
        <span
          className={`font-mono text-2xl ${isComplete ? "text-accent" : "text-text"}`}
        >
          {formatHMS(elapsedMs)}
        </span>
        <span className="font-mono text-xs text-muted">
          {isComplete
            ? `+${formatHMS(-remainingMs)} extra`
            : `${formatHMS(remainingMs)} restantes`}
        </span>
      </div>

      <div className="h-1.5 rounded-full bg-border overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${isComplete ? "bg-accent" : "bg-purple"}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex items-center justify-between mt-2 text-[10px] text-muted font-mono">
        <span>Inicio {formatTime(new Date(startedAt))}</span>
        <span>Meta {formatTime(new Date(targetEnd))}</span>
      </div>

      {error && <p className="mt-2 text-xs text-pink">{error}</p>}
    </div>
  );
}
