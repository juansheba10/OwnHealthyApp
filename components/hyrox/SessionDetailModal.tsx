"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { HyroxSessionControls } from "./HyroxSessionControls";
import type { HyroxSessionStatus } from "@/app/(main)/hyrox/actions";
import {
  HYROX_PHASES,
  HYROX_SESSION_TYPES,
  type HyroxDayCode,
  type HyroxPhaseId,
  type HyroxSession,
} from "@/lib/hyrox/plan";

const WORKOUT_TYPE_LABELS: Record<string, string> = {
  crossfit: "CrossFit",
  hyrox: "Hyrox",
  football: "Fútbol",
  running: "Running",
  other: "Otro",
};

interface Props {
  weekNum: number;
  phase: HyroxPhaseId;
  weekFocus: string;
  day: HyroxDayCode;
  session: HyroxSession;
  sessionDateLabel: string;
  initialStatus: HyroxSessionStatus | null;
  initialReplacement?: {
    type: string;
    duration_min: number;
    notes: string;
  } | null;
  onClose: () => void;
}

const BACKDROP_STYLE: React.CSSProperties = {
  position: "fixed",
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  zIndex: 100,
  backgroundColor: "rgba(0, 0, 0, 0.75)",
  backdropFilter: "blur(4px)",
  WebkitBackdropFilter: "blur(4px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "2rem 1.5rem",
  overflowY: "auto",
};

const CARD_STYLE: React.CSSProperties = {
  position: "relative",
  width: "100%",
  maxWidth: "42rem",
  maxHeight: "calc(100vh - 4rem)",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
};

export function SessionDetailModal(props: Props) {
  const { onClose } = props;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  if (typeof document === "undefined") return null;
  return createPortal(<ModalContent {...props} />, document.body);
}

function ModalContent({
  weekNum,
  phase,
  weekFocus,
  day,
  session,
  sessionDateLabel,
  initialStatus,
  initialReplacement,
  onClose,
}: Props) {
  const ph = HYROX_PHASES[phase];
  const st = HYROX_SESSION_TYPES[session.type];
  const showReplacement =
    initialStatus === "replaced_planned" && initialReplacement;
  const replacementTypeLabel = initialReplacement
    ? (WORKOUT_TYPE_LABELS[initialReplacement.type] ?? initialReplacement.type)
    : null;

  return (
    <div style={BACKDROP_STYLE} onClick={onClose}>
      <div
        style={CARD_STYLE}
        className="rounded-xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Top accent bar */}
        <div
          style={{
            height: "3px",
            width: "100%",
            backgroundColor: ph.color,
            flexShrink: 0,
          }}
        />

        <div className="overflow-y-auto p-6 sm:p-7">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div
                className="font-mono text-[10px] uppercase tracking-widest"
                style={{ color: ph.color }}
              >
                {ph.label} · S{weekNum} · {day}
              </div>
              <h2 className="mt-1 font-display text-3xl uppercase tracking-wide leading-none">
                {sessionDateLabel}
              </h2>
              <p className="mt-1.5 text-xs text-muted">{weekFocus}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="-mr-1 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface hover:text-text"
              aria-label="Cerrar"
            >
              <X size={18} />
            </button>
          </div>

          {/* Session type chip */}
          <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: st.color }}
            />
            <span className="text-xs font-medium text-text">{st.label}</span>
          </div>

          {/* Description */}
          <div className="mt-4">
            <div className="mb-2 text-[11px] uppercase tracking-wider text-muted">
              Qué hacer
            </div>
            {showReplacement ? (
              <div className="space-y-3">
                <div className="rounded-lg border border-blue/30 bg-blue/5 p-4">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-blue">
                    Reemplazo programado
                  </p>
                  <p className="mt-1 text-sm font-light text-text/90">
                    <span className="font-medium text-text">
                      {replacementTypeLabel}
                    </span>{" "}
                    · {initialReplacement!.duration_min} min
                    {initialReplacement!.notes
                      ? ` — ${initialReplacement!.notes}`
                      : ""}
                  </p>
                </div>
                <details className="rounded-lg border border-border bg-surface p-3 text-xs text-muted">
                  <summary className="cursor-pointer select-none text-[11px] uppercase tracking-wider">
                    Ver sesión Hyrox original
                  </summary>
                  <div
                    className="mt-2 text-sm font-light leading-relaxed text-text/80 [&_strong]:font-medium [&_strong]:text-text"
                    dangerouslySetInnerHTML={{ __html: session.desc }}
                  />
                </details>
              </div>
            ) : (
              <div
                className="rounded-lg border border-border bg-surface p-4 text-sm font-light leading-relaxed text-text/90 [&_strong]:font-medium [&_strong]:text-text"
                dangerouslySetInnerHTML={{ __html: session.desc }}
              />
            )}
          </div>

          {/* Controls */}
          <div className="mt-5">
            <div className="mb-2 text-[11px] uppercase tracking-wider text-muted">
              Registro
            </div>
            <HyroxSessionControls
              weekNum={weekNum}
              day={day}
              sessionType={session.type}
              initialStatus={initialStatus}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
