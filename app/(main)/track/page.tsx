"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Scale, Dumbbell, ChevronRight } from "lucide-react";
import { getTrackingSummary } from "./actions";

interface Summary {
  lastWeight: number | null;
  weightTrend: number | null;
  totalWorkouts: number;
  totalMinutes: number;
  avgFatigue: number | null;
}

export default function TrackPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTrackingSummary().then((data) => {
      setSummary(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="text-center text-muted py-8">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl uppercase tracking-wide">
        Tracking
      </h1>
      <p className="text-sm text-muted">Resumen últimos 7 días</p>

      <div className="space-y-3">
        {/* Weight card */}
        <Link
          href="/track/weight"
          className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 hover:border-accent/50 transition-colors"
        >
          <div className="w-10 h-10 rounded-lg bg-accent2/10 flex items-center justify-center">
            <Scale size={20} className="text-accent2" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium">Peso</h3>
            {summary?.lastWeight ? (
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono text-lg text-text">
                  {summary.lastWeight.toFixed(1)} kg
                </span>
                {summary.weightTrend !== null && (
                  <span
                    className={`text-xs ${summary.weightTrend <= 0 ? "text-accent2" : "text-pink"}`}
                  >
                    {summary.weightTrend > 0 ? "+" : ""}
                    {summary.weightTrend.toFixed(1)} kg
                  </span>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted mt-0.5">
                Sin registros esta semana
              </p>
            )}
          </div>
          <ChevronRight size={16} className="text-muted" />
        </Link>

        {/* Workouts card */}
        <Link
          href="/track/workouts"
          className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 hover:border-accent/50 transition-colors"
        >
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
            <Dumbbell size={20} className="text-accent" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium">Entrenamientos</h3>
            {summary && summary.totalWorkouts > 0 ? (
              <div className="flex items-center gap-3 mt-0.5 text-xs text-muted">
                <span className="font-mono text-lg text-text">
                  {summary.totalWorkouts}
                </span>
                <span>sesiones · {summary.totalMinutes} min</span>
                {summary.avgFatigue !== null && (
                  <span>· fatiga {summary.avgFatigue.toFixed(1)}</span>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted mt-0.5">
                Sin entrenos esta semana
              </p>
            )}
          </div>
          <ChevronRight size={16} className="text-muted" />
        </Link>
      </div>
    </div>
  );
}
