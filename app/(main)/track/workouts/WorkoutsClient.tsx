"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ArrowLeft,
  Trash2,
  Clock,
  Zap,
  Battery,
  CalendarPlus,
  Pencil,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { createClient } from "@/lib/supabase/client";
import {
  addWorkoutLog,
  updateWorkoutLog,
  deleteWorkoutLog,
  type WorkoutInput,
  type WorkoutLog,
} from "./actions";
import type { WorkoutType } from "@/lib/types";

const WORKOUT_TYPES: { value: WorkoutType; label: string; color: string }[] = [
  { value: "crossfit", label: "CrossFit", color: "text-accent" },
  { value: "hyrox", label: "Hyrox", color: "text-purple" },
  { value: "football", label: "Fútbol", color: "text-accent2" },
  { value: "running", label: "Running", color: "text-blue" },
  { value: "other", label: "Otro", color: "text-muted" },
];

function toLocalInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function isHyroxMarker(notes: string | null): boolean {
  return !!notes?.includes("[SALTADA]");
}

export function WorkoutsClient() {
  const router = useRouter();
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("workout_logs")
      .select("*")
      .order("date", { ascending: false })
      .limit(50);

    setLogs(
      (data ?? []).filter((row) => !isHyroxMarker(row.notes)) as WorkoutLog[]
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLogs();

    const supabase = createClient();
    const channel = supabase
      .channel("workout_logs_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "workout_logs" },
        fetchLogs
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchLogs]);

  async function handleAdd(input: WorkoutInput) {
    try {
      await addWorkoutLog(input);
      setShowForm(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error guardando entreno");
    }
  }

  async function handleUpdate(id: string, input: WorkoutInput) {
    try {
      await updateWorkoutLog(id, input);
      setEditingId(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error actualizando entreno");
    }
  }

  async function handleDelete(id: string) {
    await deleteWorkoutLog(id);
    setLogs(logs.filter((l) => l.id !== id));
  }

  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const thisWeek = logs.filter((l) => new Date(l.date) >= weekAgo);
  const totalDuration = thisWeek.reduce((s, l) => s + l.duration_min, 0);
  const avgFatigue =
    thisWeek.length > 0
      ? (thisWeek.reduce((s, l) => s + l.fatigue, 0) / thisWeek.length).toFixed(1)
      : "--";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.push("/track")} className="p-2 rounded-lg hover:bg-card">
          <ArrowLeft size={20} className="text-muted" />
        </button>
        <h1 className="font-display text-4xl uppercase tracking-wide">Entrenos</h1>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-card p-3 text-center">
          <p className="text-2xl font-mono text-text">{thisWeek.length}</p>
          <p className="text-xs text-muted">sesiones</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 text-center">
          <p className="text-2xl font-mono text-text">{totalDuration}</p>
          <p className="text-xs text-muted">minutos</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 text-center">
          <p className="text-2xl font-mono text-text">{avgFatigue}</p>
          <p className="text-xs text-muted">fatiga media</p>
        </div>
      </div>

      {!showForm && (
        <div className="space-y-2">
          <button
            onClick={() => setShowForm(true)}
            className="w-full rounded-lg bg-accent py-2.5 text-sm font-semibold text-bg"
          >
            Registrar entreno
          </button>
          <button
            onClick={() => router.push("/track/workouts/schedule")}
            className="w-full rounded-lg border border-border bg-card py-2.5 text-sm text-muted hover:text-text flex items-center justify-center gap-2"
          >
            <CalendarPlus size={14} />
            Programar próximas sesiones
          </button>
        </div>
      )}

      {showForm && (
        <WorkoutForm onSave={handleAdd} onCancel={() => setShowForm(false)} />
      )}

      <div className="space-y-2">
        <h3 className="text-xs text-muted uppercase tracking-wider">Historial</h3>
        {loading ? (
          <div className="text-center text-muted py-8">Cargando...</div>
        ) : (
          <>
            {logs.map((log) => {
              if (editingId === log.id) {
                return (
                  <WorkoutForm
                    key={log.id}
                    initial={{
                      type: log.type,
                      duration_min: log.duration_min,
                      intensity: log.intensity,
                      fatigue: log.fatigue,
                      notes: log.notes ?? "",
                      date: log.date,
                    }}
                    onSave={(input) => handleUpdate(log.id, input)}
                    onCancel={() => setEditingId(null)}
                    submitLabel="Guardar cambios"
                  />
                );
              }
              const typeInfo = WORKOUT_TYPES.find((t) => t.value === log.type) ?? WORKOUT_TYPES[4];
              return (
                <div key={log.id} className="rounded-xl border border-border bg-card p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium ${typeInfo.color}`}>
                        {typeInfo.label}
                      </span>
                      <span className="text-xs text-muted">
                        {format(new Date(log.date), "d MMM · HH:mm", { locale: es })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingId(log.id)}
                        className="p-1 rounded hover:bg-surface text-muted hover:text-accent"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(log.id)}
                        className="p-1 rounded hover:bg-surface text-muted hover:text-pink"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted">
                    <span className="flex items-center gap-1">
                      <Clock size={12} /> {log.duration_min} min
                    </span>
                    <span className="flex items-center gap-1">
                      <Zap size={12} /> Intensidad: {log.intensity}/10
                    </span>
                    <span className="flex items-center gap-1">
                      <Battery size={12} /> Fatiga: {log.fatigue}/10
                    </span>
                  </div>
                  {log.notes && (
                    <p className="text-xs text-muted mt-2">{log.notes}</p>
                  )}
                </div>
              );
            })}
            {logs.length === 0 && (
              <p className="text-center text-muted text-sm py-4">Sin entrenos registrados</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function WorkoutForm({
  initial,
  onSave,
  onCancel,
  submitLabel = "Guardar",
}: {
  initial?: WorkoutInput;
  onSave: (input: WorkoutInput) => void;
  onCancel: () => void;
  submitLabel?: string;
}) {
  const [form, setForm] = useState<WorkoutInput>(
    initial ?? {
      type: "crossfit",
      duration_min: 60,
      intensity: 7,
      fatigue: 6,
      notes: "",
    }
  );
  const [dateTime, setDateTime] = useState<string>(
    initial?.date
      ? toLocalInputValue(new Date(initial.date))
      : toLocalInputValue(new Date())
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const iso = new Date(dateTime).toISOString();
    onSave({ ...form, date: iso });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-border bg-card p-4 space-y-4"
    >
      <div>
        <label className="block text-xs text-muted mb-2">Tipo</label>
        <div className="flex gap-2 flex-wrap">
          {WORKOUT_TYPES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setForm({ ...form, type: value })}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                form.type === value
                  ? "bg-accent text-bg"
                  : "bg-surface text-muted border border-border hover:text-text"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs text-muted mb-1">Fecha y hora</label>
        <input
          type="datetime-local"
          value={dateTime}
          onChange={(e) => setDateTime(e.target.value)}
          required
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text font-mono focus:border-accent focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-xs text-muted mb-1">
          Duración: {form.duration_min} min
        </label>
        <input
          type="range"
          min={10}
          max={180}
          step={5}
          value={form.duration_min}
          onChange={(e) => setForm({ ...form, duration_min: Number(e.target.value) })}
          className="w-full accent-accent"
        />
      </div>

      <div>
        <label className="block text-xs text-muted mb-1">
          Intensidad: {form.intensity}/10
        </label>
        <input
          type="range"
          min={1}
          max={10}
          value={form.intensity}
          onChange={(e) => setForm({ ...form, intensity: Number(e.target.value) })}
          className="w-full accent-accent"
        />
      </div>

      <div>
        <label className="block text-xs text-muted mb-1">
          Fatiga post-sesión: {form.fatigue}/10
        </label>
        <input
          type="range"
          min={1}
          max={10}
          value={form.fatigue}
          onChange={(e) => setForm({ ...form, fatigue: Number(e.target.value) })}
          className="w-full accent-accent"
        />
      </div>

      <div>
        <label className="block text-xs text-muted mb-1">Notas</label>
        <input
          type="text"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="WOD, observaciones..."
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-lg border border-border py-2.5 text-sm text-muted hover:text-text"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="flex-1 rounded-lg bg-accent py-2.5 text-sm font-semibold text-bg"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
