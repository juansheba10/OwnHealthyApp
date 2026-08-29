"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createHyroxRace } from "@/app/(main)/hyrox/actions";

// Next Monday on/after a given date (or today if none given), as yyyy-mm-dd.
function nextMonday(from = new Date()): string {
  const d = new Date(from);
  const offset = (8 - d.getDay()) % 7 || 7;
  d.setDate(d.getDate() + offset);
  return d.toISOString().split("T")[0];
}

interface Props {
  onDone?: () => void;
}

export function NewRaceForm({ onDone }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [venue, setVenue] = useState("");
  const [raceDate, setRaceDate] = useState("");
  const [planStart, setPlanStart] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (planStart && new Date(planStart + "T00:00:00").getDay() !== 1) {
      setError("El inicio del plan debe ser un lunes");
      return;
    }
    if (planStart && raceDate && planStart >= raceDate) {
      setError("El inicio del plan debe ser antes de la carrera");
      return;
    }

    setSaving(true);
    try {
      await createHyroxRace({ name, venue, raceDate, planStart });
      router.refresh();
      onDone?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error creando la carrera");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-border bg-card p-4 space-y-3"
    >
      <div>
        <label className="block text-xs text-muted mb-1">
          Nombre de la carrera
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="ej. Hyrox Madrid"
          required
          className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-text focus:border-accent focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-xs text-muted mb-1">
          Lugar (opcional)
        </label>
        <input
          type="text"
          value={venue}
          onChange={(e) => setVenue(e.target.value)}
          placeholder="ej. IFEMA, Madrid"
          className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-text focus:border-accent focus:outline-none"
        />
      </div>
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-xs text-muted mb-1">
            Fecha de la carrera
          </label>
          <input
            type="date"
            value={raceDate}
            onChange={(e) => setRaceDate(e.target.value)}
            required
            className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-text font-mono focus:border-accent focus:outline-none"
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs text-muted mb-1">
            Inicio del plan (lunes)
          </label>
          <input
            type="date"
            value={planStart}
            onChange={(e) => setPlanStart(e.target.value)}
            placeholder={nextMonday()}
            required
            className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-text font-mono focus:border-accent focus:outline-none"
          />
        </div>
      </div>

      {error && <p className="text-xs text-pink">{error}</p>}

      <p className="text-xs text-muted">
        Esto crea solo la carrera. Las semanas y sesiones del plan se añaden
        aparte.
      </p>

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-lg bg-accent py-2.5 text-sm font-semibold text-bg disabled:opacity-50"
      >
        {saving ? "Creando..." : "Crear carrera"}
      </button>
    </form>
  );
}
