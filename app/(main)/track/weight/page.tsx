"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { WeightChart } from "@/components/tracking/WeightChart";
import { getWeightLogs, addWeightLog, deleteWeightLog } from "./actions";

interface WeightLog {
  id: string;
  date: string;
  weight_kg: number;
  notes: string | null;
}

export default function WeightPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<WeightLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [weight, setWeight] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

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
    await addWeightLog(parseFloat(weight), notes || undefined);
    const updated = await getWeightLogs();
    setLogs(updated as WeightLog[]);
    setWeight("");
    setNotes("");
    setSaving(false);
  }

  async function handleDelete(id: string) {
    await deleteWeightLog(id);
    setLogs(logs.filter((l) => l.id !== id));
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
          <div className="flex-1">
            <label className="block text-xs text-muted mb-1">Notas (opcional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Hidratación, sensación..."
              className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-text focus:border-accent focus:outline-none"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-accent py-2.5 text-sm font-semibold text-bg disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Registrar peso de hoy"}
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
          {[...logs].reverse().map((log) => (
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
                onClick={() => handleDelete(log.id)}
                className="p-1 rounded hover:bg-surface text-muted hover:text-pink"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {logs.length === 0 && (
            <p className="text-center text-muted text-sm py-4">Sin registros aún</p>
          )}
        </div>
      </div>
    </div>
  );
}
