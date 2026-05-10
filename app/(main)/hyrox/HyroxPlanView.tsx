"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  HYROX_PHASES,
  HYROX_SESSION_TYPES,
  type HyroxPhaseId,
  type HyroxWeek,
} from "@/lib/hyrox/plan";

type FilterValue = "all" | HyroxPhaseId;

const FILTERS: { value: FilterValue; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "1", label: "Fase 1 · Base" },
  { value: "2", label: "Fase 2 · Específico" },
  { value: "3", label: "Fase 3 · Simulaciones" },
  { value: "taper", label: "Taper" },
];

const LEGEND = [
  { color: "#4ade80", label: "Running Z2" },
  { color: "#60a5fa", label: "Híbrido / Hyrox" },
  { color: "#fbbf24", label: "Fuerza / sled" },
  { color: "#fb7185", label: "Simulación" },
  { color: "#2dd4bf", label: "Descarga / descanso" },
];

interface Props {
  weeks: HyroxWeek[];
  currentWeekNum: number | null;
  raceVenue: string;
  daysUntilRace: number;
}

export function HyroxPlanView({
  weeks,
  currentWeekNum,
  raceVenue,
  daysUntilRace,
}: Props) {
  const [filter, setFilter] = useState<FilterValue>("all");
  const [expanded, setExpanded] = useState<Set<number>>(
    () => new Set(currentWeekNum ? [currentWeekNum] : []),
  );

  const visible = filter === "all" ? weeks : weeks.filter((w) => w.phase === filter);

  function toggle(w: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(w)) next.delete(w);
      else next.add(w);
      return next;
    });
  }

  const grouped: { phase: HyroxPhaseId; weeks: HyroxWeek[] }[] = [];
  for (const w of visible) {
    const last = grouped[grouped.length - 1];
    if (last && last.phase === w.phase) last.weeks.push(w);
    else grouped.push({ phase: w.phase, weeks: [w] });
  }

  const stateLabel =
    daysUntilRace > 0
      ? `${daysUntilRace} días para la salida`
      : daysUntilRace === 0
        ? "Race day · hoy"
        : "Carrera completada";

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded border border-accent2/25 bg-accent2/10 px-3 py-1 text-[11px] font-mono uppercase tracking-wider text-accent2">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent2" />
          Primer Hyrox Canarias · 26/27
        </div>
        <h1 className="font-display text-4xl uppercase tracking-wide leading-none">
          Plan <span className="text-accent2">Hyrox</span> Tenerife
        </h1>
        <p className="text-sm text-muted">
          Santa Cruz · {raceVenue.split(" · ")[0]} · 5 sep 2026
        </p>

        <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2">
          <Stat value="21" label="semanas" accent />
          <Stat value="3" label="simulaciones" />
          <Stat value="4–5" label="días/semana" />
          <Stat
            value={stateLabel.split(" ")[0]}
            label={stateLabel.split(" ").slice(1).join(" ") || "estado"}
          />
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-1">
        {weeks.map((w) => {
          const isDone = currentWeekNum !== null && w.w < currentWeekNum;
          const isCurrent = w.w === currentWeekNum;
          const cls = isDone ? "bg-accent2" : isCurrent ? "bg-warn" : "bg-border";
          return (
            <div
              key={w.w}
              title={`S${w.w} · ${w.dateLabel}`}
              className={`h-1 flex-1 rounded ${cls}`}
            />
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] uppercase tracking-wider text-muted mr-1">
          Filtrar
        </span>
        {FILTERS.map((f) => {
          const active = filter === f.value;
          const phColor = f.value !== "all" ? HYROX_PHASES[f.value].color : null;
          return (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={`rounded-full border px-3 py-1 text-[11px] font-mono transition-colors ${
                active
                  ? "text-bg"
                  : "border-border text-muted hover:border-muted hover:text-text"
              }`}
              style={
                active
                  ? {
                      backgroundColor: phColor ?? "#b5f03d",
                      borderColor: phColor ?? "#b5f03d",
                    }
                  : undefined
              }
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-[11px] text-muted">
        {LEGEND.map((l) => (
          <div key={l.label} className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: l.color }}
            />
            {l.label}
          </div>
        ))}
      </div>

      {/* Weeks */}
      <div className="space-y-1">
        {grouped.map((group) => {
          const ph = HYROX_PHASES[group.phase];
          return (
            <div key={group.phase} className="space-y-0.5">
              <div className="flex items-center gap-3 pt-3 pb-1">
                <span
                  className="font-mono text-[11px] font-medium uppercase tracking-widest"
                  style={{ color: ph.color }}
                >
                  {ph.label}
                </span>
                <div
                  className="h-px flex-1"
                  style={{
                    background: `linear-gradient(to right, ${ph.color}33, transparent)`,
                  }}
                />
                <span className="text-[11px] text-muted">{ph.desc}</span>
              </div>

              {group.weeks.map((week) => {
                const open = expanded.has(week.w);
                const isCurrent = week.w === currentWeekNum;
                const phColor = ph.color;
                const loadPct = Math.round(week.load);
                return (
                  <div
                    key={week.w}
                    className={`overflow-hidden rounded-lg border bg-card transition-colors ${
                      open ? "border-border/80" : "border-border"
                    }`}
                    style={
                      week.raceDay
                        ? { borderLeft: `3px solid ${HYROX_PHASES.taper.color}` }
                        : week.sim
                          ? { borderLeft: "3px solid #fbbf24" }
                          : isCurrent
                            ? { borderLeft: `3px solid ${phColor}` }
                            : undefined
                    }
                  >
                    <button
                      type="button"
                      onClick={() => toggle(week.w)}
                      className="grid w-full grid-cols-[40px_72px_1fr_auto] items-center gap-0 text-left sm:grid-cols-[56px_110px_1fr_auto_auto]"
                    >
                      <div className="flex h-12 items-center justify-center border-r border-border bg-surface font-mono text-xs text-muted">
                        S{week.w}
                      </div>
                      <div className="flex h-12 items-center border-r border-border px-2 font-mono text-[11px] text-muted sm:px-3">
                        {week.dateLabel}
                      </div>
                      <div className="px-3 py-2 text-[13px] text-text/90 font-light">
                        {week.focus}
                      </div>
                      <div className="hidden sm:flex items-center gap-1.5 px-3">
                        {week.sim && !week.raceDay && (
                          <Tag label="simulación" color="#fbbf24" />
                        )}
                        {week.raceDay && <Tag label="race day" color="#4ade80" />}
                        {week.descarga && <Tag label="descarga" color="#2dd4bf" />}
                      </div>
                      <div className="flex h-12 items-center gap-2 border-l border-border px-3">
                        <div className="hidden sm:flex flex-col items-end gap-1">
                          <span
                            className="font-mono text-xs"
                            style={{ color: phColor }}
                          >
                            {week.load}%
                          </span>
                          <div className="h-[3px] w-11 rounded bg-border">
                            <div
                              className="h-[3px] rounded"
                              style={{
                                width: `${loadPct}%`,
                                backgroundColor: phColor,
                              }}
                            />
                          </div>
                        </div>
                        <ChevronDown
                          size={14}
                          className={`text-muted transition-transform ${
                            open ? "rotate-180" : ""
                          }`}
                        />
                      </div>
                    </button>

                    <div className="flex items-center gap-1.5 px-3 pb-2 sm:hidden">
                      {week.sim && !week.raceDay && (
                        <Tag label="simulación" color="#fbbf24" />
                      )}
                      {week.raceDay && <Tag label="race day" color="#4ade80" />}
                      {week.descarga && <Tag label="descarga" color="#2dd4bf" />}
                      <span
                        className="ml-auto font-mono text-[11px]"
                        style={{ color: phColor }}
                      >
                        carga {week.load}%
                      </span>
                    </div>

                    {open && (
                      <div className="border-t border-border py-1">
                        {week.sessions.map((s) => {
                          const st = HYROX_SESSION_TYPES[s.type];
                          return (
                            <div
                              key={s.day}
                              className="grid grid-cols-[40px_82px_1fr] items-center gap-0 border-b border-border last:border-b-0 sm:grid-cols-[56px_120px_1fr]"
                            >
                              <div className="py-2 text-center font-mono text-[10px] font-medium uppercase tracking-wider text-muted">
                                {s.day}
                              </div>
                              <div className="flex items-center gap-1.5 px-2 sm:px-3">
                                <span
                                  className="h-1.5 w-1.5 rounded-full"
                                  style={{ backgroundColor: st.color }}
                                />
                                <span className="text-[11px] text-muted">
                                  {st.label}
                                </span>
                              </div>
                              <div
                                className="py-2 pr-3 text-[13px] font-light text-muted [&_strong]:font-medium [&_strong]:text-text"
                                dangerouslySetInnerHTML={{ __html: s.desc }}
                              />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Stat({
  value,
  label,
  accent = false,
}: {
  value: string;
  label: string;
  accent?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span
        className={`font-mono text-xl ${accent ? "text-accent2" : "text-text"}`}
      >
        {value}
      </span>
      <span className="text-[11px] uppercase tracking-wider text-muted">
        {label}
      </span>
    </div>
  );
}

function Tag({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="rounded px-2 py-0.5 font-mono text-[10px] font-medium tracking-wide"
      style={{ backgroundColor: `${color}26`, color }}
    >
      {label}
    </span>
  );
}
