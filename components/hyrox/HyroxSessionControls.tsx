"use client";

import { useState, useTransition } from "react";
import { Check, X, Repeat, Undo2 } from "lucide-react";
import {
  logHyroxSession,
  skipHyroxSession,
  replaceHyroxSession,
  undoHyroxSession,
  type HyroxSessionStatus,
} from "@/app/(main)/hyrox/actions";
import type { HyroxDayCode, HyroxSessionType } from "@/lib/hyrox/plan";
import type { WorkoutType } from "@/lib/types";

const WORKOUT_TYPE_OPTS: { value: WorkoutType; label: string }[] = [
  { value: "crossfit", label: "CrossFit" },
  { value: "hyrox", label: "Hyrox" },
  { value: "football", label: "Fútbol" },
  { value: "running", label: "Running" },
  { value: "other", label: "Otro" },
];

interface Props {
  weekNum: number;
  day: HyroxDayCode;
  sessionType: HyroxSessionType;
  initialStatus: HyroxSessionStatus | null;
  onStatusChange?: (status: HyroxSessionStatus | null) => void;
}

export function HyroxSessionControls({
  weekNum,
  day,
  sessionType,
  initialStatus,
  onStatusChange,
}: Props) {
  const [status, setStatus] = useState<HyroxSessionStatus | null>(initialStatus);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showReplaceForm, setShowReplaceForm] = useState(false);

  function setStatusAndNotify(s: HyroxSessionStatus | null) {
    setStatus(s);
    onStatusChange?.(s);
  }

  function withTransition(fn: () => Promise<void>) {
    setError(null);
    startTransition(async () => {
      try {
        await fn();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error");
      }
    });
  }

  function handleDone() {
    withTransition(async () => {
      await logHyroxSession(weekNum, day);
      setStatusAndNotify("done");
    });
  }

  function handleSkip() {
    withTransition(async () => {
      await skipHyroxSession(weekNum, day);
      setStatusAndNotify("skipped");
    });
  }

  function handleUndo() {
    withTransition(async () => {
      await undoHyroxSession(weekNum, day);
      setStatusAndNotify(null);
      setShowReplaceForm(false);
    });
  }

  function handleReplaceSubmit(input: {
    type: WorkoutType;
    duration_min: number;
    intensity: number;
    fatigue: number;
    notes: string;
  }) {
    withTransition(async () => {
      await replaceHyroxSession({ weekNum, day, ...input });
      setStatusAndNotify("replaced");
      setShowReplaceForm(false);
    });
  }

  if (sessionType === "rest") {
    return (
      <p className="text-[11px] text-muted">Día de descanso · sin registro</p>
    );
  }

  return (
    <div className="space-y-2">
      {status === "done" && (
        <StatusChip
          icon={<Check size={14} />}
          label="Hecho"
          colorClass="bg-accent2/15 text-accent2"
          onUndo={handleUndo}
          pending={pending}
        />
      )}
      {status === "skipped" && (
        <StatusChip
          icon={<X size={14} />}
          label="Saltada"
          colorClass="bg-pink/15 text-pink"
          onUndo={handleUndo}
          pending={pending}
        />
      )}
      {status === "replaced" && (
        <StatusChip
          icon={<Repeat size={14} />}
          label="Reemplazada"
          colorClass="bg-blue/15 text-blue"
          onUndo={handleUndo}
          pending={pending}
        />
      )}

      {status === null && !showReplaceForm && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleDone}
            disabled={pending}
            className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-bg disabled:opacity-50"
          >
            {pending ? "Guardando..." : "Marcar hecho"}
          </button>
          <button
            type="button"
            onClick={handleSkip}
            disabled={pending}
            className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs text-muted hover:text-pink disabled:opacity-50"
          >
            <X size={12} /> Saltada
          </button>
          <button
            type="button"
            onClick={() => setShowReplaceForm(true)}
            disabled={pending}
            className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs text-muted hover:text-blue disabled:opacity-50"
          >
            <Repeat size={12} /> Reemplazar
          </button>
        </div>
      )}

      {status === null && showReplaceForm && (
        <ReplaceForm
          pending={pending}
          onCancel={() => setShowReplaceForm(false)}
          onSubmit={handleReplaceSubmit}
        />
      )}

      {error && <p className="text-xs text-pink">{error}</p>}
    </div>
  );
}

function StatusChip({
  icon,
  label,
  colorClass,
  onUndo,
  pending,
}: {
  icon: React.ReactNode;
  label: string;
  colorClass: string;
  onUndo: () => void;
  pending: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium ${colorClass}`}
      >
        {icon} {label}
      </span>
      <button
        type="button"
        onClick={onUndo}
        disabled={pending}
        className="flex items-center gap-1 text-xs text-muted hover:text-text disabled:opacity-50"
      >
        <Undo2 size={12} /> Deshacer
      </button>
    </div>
  );
}

function ReplaceForm({
  pending,
  onCancel,
  onSubmit,
}: {
  pending: boolean;
  onCancel: () => void;
  onSubmit: (input: {
    type: WorkoutType;
    duration_min: number;
    intensity: number;
    fatigue: number;
    notes: string;
  }) => void;
}) {
  const [type, setType] = useState<WorkoutType>("other");
  const [duration, setDuration] = useState(45);
  const [intensity, setIntensity] = useState(6);
  const [fatigue, setFatigue] = useState(6);
  const [notes, setNotes] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({ type, duration_min: duration, intensity, fatigue, notes });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-lg border border-border bg-surface p-3"
    >
      <div>
        <label className="mb-1 block text-[11px] uppercase tracking-wider text-muted">
          Tipo
        </label>
        <div className="flex flex-wrap gap-1.5">
          {WORKOUT_TYPE_OPTS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setType(opt.value)}
              className={`rounded px-2.5 py-1 text-[11px] font-medium transition-colors ${
                type === opt.value
                  ? "bg-accent text-bg"
                  : "border border-border text-muted hover:text-text"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-[11px] uppercase tracking-wider text-muted">
          Duración: {duration} min
        </label>
        <input
          type="range"
          min={5}
          max={180}
          step={5}
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          className="w-full accent-accent"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-[11px] uppercase tracking-wider text-muted">
            Intensidad: {intensity}/10
          </label>
          <input
            type="range"
            min={1}
            max={10}
            value={intensity}
            onChange={(e) => setIntensity(Number(e.target.value))}
            className="w-full accent-accent"
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] uppercase tracking-wider text-muted">
            Fatiga: {fatigue}/10
          </label>
          <input
            type="range"
            min={1}
            max={10}
            value={fatigue}
            onChange={(e) => setFatigue(Number(e.target.value))}
            className="w-full accent-accent"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-[11px] uppercase tracking-wider text-muted">
          Notas
        </label>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Qué hiciste en su lugar..."
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={pending}
          className="flex-1 rounded-lg border border-border py-2 text-xs text-muted hover:text-text disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={pending}
          className="flex-1 rounded-lg bg-blue py-2 text-xs font-semibold text-bg disabled:opacity-50"
        >
          {pending ? "Guardando..." : "Guardar reemplazo"}
        </button>
      </div>
    </form>
  );
}
