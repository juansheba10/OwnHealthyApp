"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Trash2, Pencil, Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { WeightChart } from "@/components/tracking/WeightChart";
import {
  getWeightLogs,
  addWeightLog,
  updateWeightLog,
  deleteWeightLog,
} from "./actions";

interface WeightLog {
  id: string;
  date: string;
  weight_kg: number;
  notes: string | null;
}

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

export default function WeightPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<WeightLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(todayStr);
  const [weight, setWeight] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    getWeightLogs().then((data) => {
      setLogs(data as WeightLog[]);
      setLoading(false);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!weight) return;
    setSaving(true);
    try {
      await addWeightLog(parseFloat(weight), notes || undefined, date);
      const updated = await getWeightLogs();
      setLogs(updated as WeightLog[]);
      setWeight("");
      setNotes("");
      setDate(todayStr());
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error guardando peso");
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    await deleteWeightLog(id);
    setLogs(logs.filter((l) => l.id !== id));
  }

  async function handleUpdate(
    id: string,
    w: number,
    d: string,
    n?: string
  ) {
    try {
      await updateWeightLog(id, w, d, n);
      const updated = await getWeightLogs();
      setLogs(updated as WeightLog[]);
      setEditingId(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error actualizando peso");
    }
  }

  const last7 = logs.slice(-7);
  const trend =
    last7.length >= 2
      ? Number(last7[last7.length - 1].weight_kg) - Number(last7[0].weight_kg)
      : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.push("/track")} className="p-2 rounded-lg hover:bg-card">
          <ArrowLeft size={20} className="text-muted" />
        </button>
        <h1 className="font-display text-4xl uppercase tracking-wide">Peso</h1>
      </div>

      {/* Quick input */}
      <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex gap-3">
          <div className="w-36">
            <label className="block text-xs text-muted mb-1">Fecha</label>
            <input
              type="date"
              value={date}
              max={todayStr()}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-text font-mono focus:border-accent focus:outline-none"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-muted mb-1">Peso (kg)</label>
            <input
              type="number"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="ej. 89.5"
              required
              className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-text font-mono focus:border-accent focus:outline-none"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs text-muted mb-1">Notas (opcional)</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Hidratación, sensación..."
            className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-text focus:border-accent focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-accent py-2.5 text-sm font-semibold text-bg disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Registrar peso"}
        </button>
      </form>

      {/* Trend */}
      {trend !== null && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted">Últimos 7 días:</span>
          <span className={trend <= 0 ? "text-accent2" : "text-pink"}>
            {trend > 0 ? "+" : ""}
            {trend.toFixed(1)} kg
          </span>
        </div>
      )}

      {/* Chart */}
      {loading ? (
        <div className="text-center text-muted py-8">Cargando...</div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-xs text-muted mb-3 uppercase tracking-wider">Evolución</h3>
          <WeightChart data={logs} goalWeight={85} />
        </div>
      )}

      {/* History */}
      <div>
        <h3 className="text-xs text-muted mb-3 uppercase tracking-wider">Historial</h3>
        <div className="space-y-1">
          {[...logs].reverse().map((log) =>
            editingId === log.id ? (
              <WeightEditRow
                key={log.id}
                log={log}
                onSave={(w, d, n) => handleUpdate(log.id, w, d, n)}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <div
                key={log.id}
                className="flex items-center gap-3 rounded-lg bg-card px-3 py-2.5"
              >
                <span className="text-xs text-muted w-20">
                  {format(new Date(log.date + "T12:00:00"), "d MMM yyyy", { locale: es })}
                </span>
                <span className="font-mono text-sm text-text flex-1">
                  {Number(log.weight_kg).toFixed(1)} kg
                </span>
                {log.notes && (
                  <span className="text-xs text-muted truncate max-w-32">{log.notes}</span>
                )}
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
            )
          )}
          {logs.length === 0 && (
            <p className="text-center text-muted text-sm py-4">Sin registros aún</p>
          )}
        </div>
      </div>
    </div>
  );
}

function WeightEditRow({
  log,
  onSave,
  onCancel,
}: {
  log: WeightLog;
  onSave: (weight: number, date: string, notes?: string) => void;
  onCancel: () => void;
}) {
  const [date, setDate] = useState(log.date);
  const [weight, setWeight] = useState(String(log.weight_kg));
  const [notes, setNotes] = useState(log.notes ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!weight) return;
    onSave(parseFloat(weight), date, notes || undefined);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-accent/40 bg-card px-3 py-3 space-y-2"
    >
      <div className="flex gap-2">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          className="w-36 rounded border border-border bg-surface px-2 py-1.5 text-xs text-text font-mono focus:border-accent focus:outline-none"
        />
        <input
          type="number"
          step="0.1"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          required
          className="flex-1 rounded border border-border bg-surface px-2 py-1.5 text-xs text-text font-mono focus:border-accent focus:outline-none"
        />
      </div>
      <input
        type="text"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notas"
        className="w-full rounded border border-border bg-surface px-2 py-1.5 text-xs text-text focus:border-accent focus:outline-none"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 flex items-center justify-center gap-1 rounded border border-border py-1.5 text-xs text-muted hover:text-text"
        >
          <X size={12} /> Cancelar
        </button>
        <button
          type="submit"
          className="flex-1 flex items-center justify-center gap-1 rounded bg-accent py-1.5 text-xs font-semibold text-bg"
        >
          <Check size={12} /> Guardar
        </button>
      </div>
    </form>
  );
}
