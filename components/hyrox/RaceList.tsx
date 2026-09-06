"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, MapPin, Timer, Pencil, CalendarOff } from "lucide-react";
import {
  clearHyroxPlan,
  deleteHyroxRace,
  setHyroxRaceResult,
} from "@/app/(main)/hyrox/actions";
import {
  HYROX_RACE_FORMATS,
  formatFinishTime,
  type HyroxRaceFormat,
} from "@/lib/hyrox/plan";
import type { HyroxRace } from "@/lib/hyrox/data";

function formatRaceDate(iso: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso + "T00:00:00"));
}

interface Props {
  races: HyroxRace[];
  activeRaceId: string | null;
}

type PendingAction = { id: string; type: "delete" | "clearPlan" };

export function RaceList({ races, activeRaceId }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [busy, setBusy] = useState<PendingAction | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [timeInput, setTimeInput] = useState("");
  const [formatInput, setFormatInput] = useState<HyroxRaceFormat | "">("");
  const [error, setError] = useState<string | null>(null);

  if (races.length === 0) return null;

  async function handleConfirm(action: PendingAction) {
    setError(null);
    setBusy(action);
    try {
      if (action.type === "delete") {
        await deleteHyroxRace(action.id);
      } else {
        await clearHyroxPlan(action.id);
      }
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : action.type === "delete"
            ? "Error borrando la carrera"
            : "Error borrando el plan",
      );
    } finally {
      setBusy(null);
      setPending(null);
    }
  }

  function startEdit(race: HyroxRace) {
    setError(null);
    setEditId(race.id);
    setTimeInput(
      race.finishTimeSeconds !== null
        ? formatFinishTime(race.finishTimeSeconds)
        : "",
    );
    setFormatInput(race.format ?? "");
  }

  async function handleSaveResult(id: string) {
    setError(null);
    setSavingId(id);
    try {
      await setHyroxRaceResult(id, {
        finishTime: timeInput,
        format: formatInput || null,
      });
      setEditId(null);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error guardando el resultado",
      );
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">Mis carreras</h3>
      <div className="divide-y divide-border rounded-xl border border-border bg-card">
        {races.map((race) => {
          const racePending = pending?.id === race.id ? pending : null;
          const isBusy = busy?.id === race.id;
          return (
            <div key={race.id} className="space-y-2 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm text-text">
                      {race.name}
                    </span>
                    {race.id === activeRaceId && (
                      <span className="shrink-0 rounded-full bg-accent2/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-accent2">
                        Activa
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                    {formatRaceDate(race.raceDate)}
                    {race.venue && (
                      <>
                        <span className="text-border">·</span>
                        <MapPin size={11} />
                        {race.venue}
                      </>
                    )}
                  </p>
                </div>

                {racePending ? (
                  <div className="flex shrink-0 items-center gap-1.5">
                    <span className="text-xs text-muted">
                      {racePending.type === "clearPlan"
                        ? "¿Borrar plan?"
                        : "¿Eliminar?"}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleConfirm(racePending)}
                      disabled={isBusy}
                      className="rounded-lg border border-pink/30 bg-pink/10 px-2.5 py-1 text-xs text-pink hover:bg-pink/20 disabled:opacity-50"
                    >
                      {isBusy ? "…" : "Sí"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPending(null)}
                      disabled={isBusy}
                      className="rounded-lg border border-border bg-card px-2.5 py-1 text-xs text-muted hover:text-text"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        setPending({ id: race.id, type: "clearPlan" })
                      }
                      className="rounded p-1 text-muted hover:bg-surface hover:text-text"
                      aria-label={`Borrar plan de ${race.name}`}
                      title="Borrar solo el plan de entrenamiento"
                    >
                      <CalendarOff size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setPending({ id: race.id, type: "delete" })
                      }
                      className="rounded p-1 text-muted hover:bg-surface hover:text-pink"
                      aria-label={`Eliminar ${race.name}`}
                      title="Eliminar la carrera y su plan"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>

              {editId === race.id ? (
                <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-surface p-2.5">
                  <input
                    type="text"
                    value={timeInput}
                    onChange={(e) => setTimeInput(e.target.value)}
                    placeholder="h:mm:ss"
                    className="w-24 rounded-lg border border-border bg-card px-2 py-1.5 text-xs text-text font-mono focus:border-accent focus:outline-none"
                  />
                  <select
                    value={formatInput}
                    onChange={(e) =>
                      setFormatInput(e.target.value as HyroxRaceFormat | "")
                    }
                    className="rounded-lg border border-border bg-card px-2 py-1.5 text-xs text-text focus:border-accent focus:outline-none"
                  >
                    <option value="">Formato</option>
                    {Object.entries(HYROX_RACE_FORMATS).map(([value, meta]) => (
                      <option key={value} value={value}>
                        {meta.label}
                      </option>
                    ))}
                  </select>
                  <div className="ml-auto flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleSaveResult(race.id)}
                      disabled={savingId === race.id}
                      className="rounded-lg bg-accent px-2.5 py-1 text-xs font-semibold text-bg disabled:opacity-50"
                    >
                      {savingId === race.id ? "…" : "Guardar"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditId(null)}
                      disabled={savingId === race.id}
                      className="rounded-lg border border-border bg-card px-2.5 py-1 text-xs text-muted hover:text-text"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => startEdit(race)}
                  className="flex items-center gap-1.5 text-xs text-muted hover:text-text transition-colors"
                >
                  {race.finishTimeSeconds !== null || race.format ? (
                    <>
                      <Timer size={12} />
                      {race.finishTimeSeconds !== null
                        ? formatFinishTime(race.finishTimeSeconds)
                        : "Sin tiempo"}
                      {race.format && (
                        <>
                          <span className="text-border">·</span>
                          {HYROX_RACE_FORMATS[race.format].label}
                        </>
                      )}
                      <Pencil size={11} className="ml-0.5" />
                    </>
                  ) : (
                    <>
                      <Timer size={12} />
                      Añadir resultado
                    </>
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>
      {error && <p className="text-xs text-pink">{error}</p>}
    </div>
  );
}
