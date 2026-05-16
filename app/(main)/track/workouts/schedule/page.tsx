"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { format, addDays } from "date-fns";
import { es } from "date-fns/locale";
import {
  getSchedule,
  addPlannedSession,
  deletePlannedSession,
  type PlannedSessionInput,
} from "./actions";
import type { WorkoutPlan, WorkoutType } from "@/lib/types";

const WORKOUT_TYPES: { value: WorkoutType; label: string; color: string }[] = [
  { value: "crossfit", label: "CrossFit", color: "text-accent" },
  { value: "hyrox", label: "Hyrox", color: "text-purple" },
  { value: "football", label: "Fútbol", color: "text-accent2" },
  { value: "running", label: "Running", color: "text-blue" },
  { value: "other", label: "Otro", color: "text-muted" },
];

const HORIZON_DAYS = 14;

export default function SchedulePage() {
  const router = useRouter();
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDate, setOpenDate] = useState<string | null>(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = format(today, "yyyy-MM-dd");
  const end = format(addDays(today, HORIZON_DAYS - 1), "yyyy-MM-dd");

  useEffect(() => {
    getSchedule(start, end).then((data) => {
      setPlans(data as WorkoutPlan[]);
      setLoading(false);
    });
  }, [start, end]);

  async function handleAdd(input: PlannedSessionInput) {
    await addPlannedSession(input);
    const refreshed = await getSchedule(start, end);
    setPlans(refreshed as WorkoutPlan[]);
    setOpenDate(null);
  }

  async function handleDelete(id: string) {
    await deletePlannedSession(id);
    setPlans(plans.filter((p) => p.id !== id));
  }

  const days = Array.from({ length: HORIZON_DAYS }, (_, i) =>
    addDays(today, i),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/track/workouts")}
          className="p-2 rounded-lg hover:bg-card"
        >
          <ArrowLeft size={20} className="text-muted" />
        </button>
        <h1 className="font-display text-4xl uppercase tracking-wide">
          Programación
        </h1>
      </div>

      <p className="text-xs text-muted">
        Programa tus entrenos de los próximos {HORIZON_DAYS} días. La IA usará
        este calendario para generar el plan de comidas.
      </p>

      {loading ? (
        <div className="text-center text-muted py-8">Cargando...</div>
      ) : (
        <div className="space-y-2">
          {days.map((d) => {
            const dateStr = format(d, "yyyy-MM-dd");
            const sessions = plans.filter((p) => p.date === dateStr);
            const isOpen = openDate === dateStr;
            return (
              <div
                key={dateStr}
                className="rounded-xl border border-border bg-card p-3"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm text-text capitalize">
                    {format(d, "EEEE d MMM", { locale: es })}
                  </p>
                  <button
                    onClick={() => setOpenDate(isOpen ? null : dateStr)}
                    className="rounded-md bg-surface border border-border px-2 py-1 text-xs text-muted hover:text-text"
                  >
                    <Plus size={12} className="inline mr-1" />
                    Añadir
                  </button>
                </div>

                {sessions.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {sessions.map((s) => {
                      const ti =
                        WORKOUT_TYPES.find((t) => t.value === s.type) ??
                        WORKOUT_TYPES[4];
                      return (
                        <div
                          key={s.id}
                          className="flex items-center justify-between text-xs bg-surface rounded-md px-2 py-1.5"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span
                              className={`font-medium shrink-0 ${ti.color}`}
                            >
                              {ti.label}
                            </span>
                            {s.intended_intensity != null && (
                              <span className="text-muted shrink-0">
                                Intensidad {s.intended_intensity}/10
                              </span>
                            )}
                            {s.notes && (
                              <span className="text-muted truncate">
                                · {s.notes}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => handleDelete(s.id)}
                            className="p-1 rounded hover:bg-card text-muted hover:text-pink shrink-0"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {sessions.length === 0 && !isOpen && (
                  <p className="text-xs text-muted mt-1">Descanso</p>
                )}

                {isOpen && (
                  <div className="mt-3">
                    <PlannedSessionForm
                      date={dateStr}
                      onSave={handleAdd}
                      onCancel={() => setOpenDate(null)}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PlannedSessionForm({
  date,
  onSave,
  onCancel,
}: {
  date: string;
  onSave: (input: PlannedSessionInput) => void;
  onCancel: () => void;
}) {
  const [type, setType] = useState<WorkoutType>("crossfit");
  const [intensity, setIntensity] = useState<number>(7);
  const [notes, setNotes] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      date,
      type,
      intended_intensity: intensity,
      notes: notes.trim() || null,
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 bg-surface border border-border rounded-lg p-3"
    >
      <div>
        <label className="block text-xs text-muted mb-2">Tipo</label>
        <div className="flex gap-2 flex-wrap">
          {WORKOUT_TYPES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setType(value)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                type === value
                  ? "bg-accent text-bg"
                  : "bg-card text-muted border border-border hover:text-text"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs text-muted mb-1">
          Intensidad prevista: {intensity}/10
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
        <label className="block text-xs text-muted mb-1">Notas</label>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Foco, observaciones..."
          className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-md border border-border py-2 text-xs text-muted hover:text-text"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="flex-1 rounded-md bg-accent py-2 text-xs font-semibold text-bg"
        >
          Guardar
        </button>
      </div>
    </form>
  );
}
