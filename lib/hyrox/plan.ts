// Pure Hyrox plan helpers. The actual race/week/session data lives in
// Supabase (hyrox_races / hyrox_weeks / hyrox_sessions) — see lib/hyrox/data.ts
// for the DB-backed fetchers. This file only knows how to work with an
// already-fetched HyroxWeek[] array, so it stays framework/DB-free and easy
// to unit test.

export type HyroxSessionType = "run" | "hybrid" | "strength" | "sim" | "rest";

export type HyroxPhaseId = "1" | "2" | "3" | "taper";

export type HyroxDayCode = "Lun" | "Mar" | "Mié" | "Jue" | "Vie" | "Sáb";

export interface HyroxSession {
  day: HyroxDayCode;
  type: HyroxSessionType;
  desc: string;
}

export interface HyroxWeek {
  w: number;
  phase: HyroxPhaseId;
  startDate: string; // ISO yyyy-mm-dd, Wednesday-anchored
  dateLabel: string; // Spanish display label, e.g. "8–14 abr"
  load: number;
  focus: string;
  descarga?: boolean;
  sim?: boolean;
  raceDay?: boolean;
  sessions: HyroxSession[];
}

export const HYROX_PHASES: Record<
  HyroxPhaseId,
  { label: string; desc: string; color: string }
> = {
  "1": {
    label: "Fase 1",
    desc: "Umbral desde el día 1 · semanas 1–5",
    color: "#4ade80",
  },
  "2": {
    label: "Fase 2",
    desc: "Específico Hyrox · semanas 6–11",
    color: "#60a5fa",
  },
  "3": {
    label: "Fase 3",
    desc: "Simulaciones · semanas 12–18",
    color: "#fbbf24",
  },
  taper: {
    label: "Taper",
    desc: "Llegada fresca · semanas 19–21",
    color: "#fb7185",
  },
};

export const HYROX_SESSION_TYPES: Record<
  HyroxSessionType,
  { color: string; label: string }
> = {
  run: { color: "#4ade80", label: "Running" },
  hybrid: { color: "#60a5fa", label: "Hyrox/Hybrid" },
  strength: { color: "#fbbf24", label: "Fuerza + sled" },
  sim: { color: "#fb7185", label: "Simulación" },
  rest: { color: "#2dd4bf", label: "Descanso" },
};

export const HYROX_DAY_ORDER: HyroxDayCode[] = [
  "Lun",
  "Mar",
  "Mié",
  "Jue",
  "Vie",
  "Sáb",
];

const DAY_OFFSETS: Record<HyroxDayCode, number> = {
  Lun: 0,
  Mar: 1,
  Mié: 2,
  Jue: 3,
  Vie: 4,
  Sáb: 5,
};

// JS getDay(): 0=Sun, 1=Mon, ..., 6=Sat. Map 1..6 to Lun..Sáb; null for Sun.
export function dayCodeFromDate(date: Date): HyroxDayCode | null {
  const dow = date.getDay();
  if (dow === 0) return null;
  return HYROX_DAY_ORDER[dow - 1] ?? null;
}

// Calendar date (yyyy-mm-dd) of a given session within a week.
export function getSessionDateIso(week: HyroxWeek, day: HyroxDayCode): string {
  const start = new Date(week.startDate + "T00:00:00");
  start.setDate(start.getDate() + DAY_OFFSETS[day]);
  return isoDate(start);
}

const MONTHS_ES = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

// Human label like "lun 11 may"
export function getSessionDateLabel(
  week: HyroxWeek,
  day: HyroxDayCode,
): string {
  const start = new Date(week.startDate + "T00:00:00");
  start.setDate(start.getDate() + DAY_OFFSETS[day]);
  return `${day.toLowerCase()} ${start.getDate()} ${MONTHS_ES[start.getMonth()]}`;
}

// Number of days between two ISO dates (UTC-safe).
function daysBetween(fromIso: string, toIso: string): number {
  const a = new Date(fromIso + "T00:00:00").getTime();
  const b = new Date(toIso + "T00:00:00").getTime();
  return Math.round((b - a) / 86400000);
}

export function isoDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// Returns the week containing `date`, or null if before plan start / after race day.
export function getWeekForDate(
  weeks: HyroxWeek[],
  planStart: string,
  raceDate: string,
  date: Date,
): HyroxWeek | null {
  if (weeks.length === 0) return null;
  const iso = isoDate(date);
  if (iso < planStart || iso > raceDate) return null;
  const days = daysBetween(planStart, iso);
  const idx = Math.floor(days / 7);
  return weeks[Math.min(idx, weeks.length - 1)] ?? null;
}

export function getSessionForDate(
  weeks: HyroxWeek[],
  planStart: string,
  raceDate: string,
  date: Date,
): { week: HyroxWeek; session: HyroxSession } | null {
  const week = getWeekForDate(weeks, planStart, raceDate, date);
  if (!week) return null;
  const code = dayCodeFromDate(date);
  if (!code) return null;
  const session = week.sessions.find((s) => s.day === code);
  if (!session) return null;
  return { week, session };
}

export function daysUntilRace(raceDate: string, today: Date): number {
  return daysBetween(isoDate(today), raceDate);
}
