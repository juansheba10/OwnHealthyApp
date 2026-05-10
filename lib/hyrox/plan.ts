// Hyrox Tenerife — 5 sep 2026 · Recinto Ferial
// 21-week plan, fixed dates. Sessions Mon–Sat, no Sunday.

export type HyroxSessionType =
  | "run"
  | "hybrid"
  | "strength"
  | "sim"
  | "rest";

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

export const HYROX_PLAN_START = "2026-04-13";
export const HYROX_RACE_DATE = "2026-09-05";
export const HYROX_RACE_VENUE = "Recinto Ferial · Av. Constitución 12, Santa Cruz";

export const HYROX_PHASES: Record<
  HyroxPhaseId,
  { label: string; desc: string; color: string }
> = {
  "1": { label: "Fase 1", desc: "Umbral desde el día 1 · semanas 1–5", color: "#4ade80" },
  "2": { label: "Fase 2", desc: "Específico Hyrox · semanas 6–11", color: "#60a5fa" },
  "3": { label: "Fase 3", desc: "Simulaciones · semanas 12–18", color: "#fbbf24" },
  taper: { label: "Taper", desc: "Llegada fresca · semanas 19–21", color: "#fb7185" },
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

export const HYROX_WEEKS: HyroxWeek[] = [
  {
    w: 1, phase: "1", startDate: "2026-04-13", dateLabel: "13–19 abr", load: 65,
    focus: "Base running + técnica sled",
    sessions: [
      { day: "Lun", type: "run", desc: "Running 20 min Z2 muy suave — test inicial. Nota cómo responden las piernas." },
      { day: "Mar", type: "hybrid", desc: "Clase Hyrox/Hybrid — pide al coach priorizar sled push y running corto." },
      { day: "Mié", type: "strength", desc: "Fuerza: sentadilla goblet 4×10, hip thrust 3×12 + 3 series sled push técnico (poco peso)." },
      { day: "Jue", type: "rest", desc: "Descanso activo — paseo 30 min, foam rolling piernas." },
      { day: "Vie", type: "run", desc: "<strong>Run/Walk:</strong> 5 min trote / 1 min caminar × 4 rondas. Total ~25 min en movimiento." },
      { day: "Sáb", type: "hybrid", desc: "Clase o circuito propio: ski erg 3×500m + row 3×500m + wall balls 3×15." },
    ],
  },
  {
    w: 2, phase: "1", startDate: "2026-04-20", dateLabel: "20–26 abr", load: 68,
    focus: "Consolidar running continuo",
    sessions: [
      { day: "Lun", type: "run", desc: "Running 25 min Z2 continuo (si S1 fue bien) o run/walk 30 min." },
      { day: "Mar", type: "hybrid", desc: "Clase Hyrox/Hybrid." },
      { day: "Mié", type: "strength", desc: "Fuerza + 4 series sled push con más peso que S1. Observa técnica: 45° de inclinación, pasos cortos." },
      { day: "Jue", type: "rest", desc: "Descanso activo." },
      { day: "Vie", type: "run", desc: "<strong>Fartlek suave:</strong> 25 min con 3×2 min a ritmo algo más vivo intercalados." },
      { day: "Sáb", type: "hybrid", desc: "Sesión larga: running 35 min Z2 + circuito 2 rondas (ski+row+lunges)." },
    ],
  },
  {
    w: 3, phase: "1", startDate: "2026-04-27", dateLabel: "27 abr–3 may", load: 75,
    focus: "Primer tempo + sled pull",
    sessions: [
      { day: "Lun", type: "run", desc: "Running 30 min Z2 continuo." },
      { day: "Mar", type: "hybrid", desc: "Clase Hyrox/Hybrid." },
      { day: "Mié", type: "strength", desc: "Fuerza pesada + sled pull (cuerda). Técnica: no te eches atrás, tira con caderas hacia delante." },
      { day: "Jue", type: "rest", desc: "Descanso." },
      { day: "Vie", type: "run", desc: "<strong>Tempo:</strong> 10 min Z2 calentamiento + 15 min a ritmo umbral (conversación difícil) + 5 min suave." },
      { day: "Sáb", type: "hybrid", desc: "Sesión larga: 40 min running Z2 + circuito Hyrox 2 rondas." },
    ],
  },
  {
    w: 4, phase: "1", startDate: "2026-05-04", dateLabel: "4–10 may", load: 55,
    focus: "Descarga · absorber adaptaciones", descarga: true,
    sessions: [
      { day: "Lun", type: "run", desc: "Running 25 min muy suave — semana de descarga, no fuerces." },
      { day: "Mar", type: "hybrid", desc: "Clase Hyrox (intensidad moderada, no al límite)." },
      { day: "Mié", type: "strength", desc: "Movilidad 20 min + sled técnico con poco peso, foco en forma." },
      { day: "Jue", type: "rest", desc: "Descanso total." },
      { day: "Vie", type: "run", desc: "Running 20 min Z2." },
      { day: "Sáb", type: "hybrid", desc: "Clase ligera o circuito corto 1 ronda. Sin competir con nadie ni contigo mismo." },
    ],
  },
  {
    w: 5, phase: "1", startDate: "2026-05-11", dateLabel: "11–17 may", load: 78,
    focus: "Pesos de competición por primera vez",
    sessions: [
      { day: "Lun", type: "run", desc: "Running 35 min Z2 + 4×20s strides al final." },
      { day: "Mar", type: "hybrid", desc: "Clase Hyrox/Hybrid — alta intensidad." },
      { day: "Mié", type: "strength", desc: "<strong>Primera vez con peso competición:</strong> sled push 102 kg (H) / 57 kg (M). Series cortas, técnica impecable." },
      { day: "Jue", type: "rest", desc: "Descanso activo." },
      { day: "Vie", type: "run", desc: "Fartlek 35 min: 6×2 min rápido / 90s suave." },
      { day: "Sáb", type: "sim", desc: "<strong>Simulación parcial:</strong> 4 km running + estaciones 1–4 encadenadas. Sin parar." },
    ],
  },
  {
    w: 6, phase: "2", startDate: "2026-05-18", dateLabel: "18–24 may", load: 80,
    focus: "Intervalos 1 km + circuito completo",
    sessions: [
      { day: "Lun", type: "run", desc: "Running 45 min Z2." },
      { day: "Mar", type: "hybrid", desc: "Clase Hyrox — pide al coach encadenar sled push+pull+running." },
      { day: "Mié", type: "strength", desc: "Fuerza + carries (farmers) + sled pull largo 2×20m." },
      { day: "Jue", type: "rest", desc: "Descanso." },
      { day: "Vie", type: "run", desc: "<strong>Intervalos:</strong> 5×1 km a ritmo objetivo carrera + 400m suave entre cada uno." },
      { day: "Sáb", type: "hybrid", desc: "Circuito Hyrox completo 2 rondas + 1 km running entre estaciones." },
    ],
  },
  {
    w: 7, phase: "2", startDate: "2026-05-25", dateLabel: "25–31 may", load: 83,
    focus: "Simulación 6 km + 6 estaciones",
    sessions: [
      { day: "Lun", type: "run", desc: "Running 50 min Z2." },
      { day: "Mar", type: "hybrid", desc: "Clase Hyrox/Hybrid." },
      { day: "Mié", type: "strength", desc: "Sled pesado (peso carrera) + farmers carry + row erg 3×500m." },
      { day: "Jue", type: "rest", desc: "Descanso activo." },
      { day: "Vie", type: "run", desc: "Tempo 35 min + 2 km a ritmo objetivo al final." },
      { day: "Sáb", type: "sim", desc: "<strong>Simulación:</strong> 6 km running + estaciones 1–6 encadenadas." },
    ],
  },
  {
    w: 8, phase: "2", startDate: "2026-06-01", dateLabel: "1–7 jun", load: 85,
    focus: "Volumen alto · cargas acumuladas",
    sessions: [
      { day: "Lun", type: "run", desc: "Running 55 min Z2 + strides." },
      { day: "Mar", type: "hybrid", desc: "Clase Hyrox/Hybrid — alta intensidad." },
      { day: "Mié", type: "strength", desc: "Fuerza + sled push+pull + sandbag lunges 2×25m." },
      { day: "Jue", type: "rest", desc: "Descanso." },
      { day: "Vie", type: "run", desc: "<strong>Intervalos:</strong> 6×1 km a ritmo objetivo + 400m recuperación." },
      { day: "Sáb", type: "run", desc: "Sesión larga running 70 min Z2 — resistencia aeróbica pura." },
    ],
  },
  {
    w: 9, phase: "2", startDate: "2026-06-08", dateLabel: "8–14 jun", load: 60,
    focus: "Descarga · semana de absorción", descarga: true,
    sessions: [
      { day: "Lun", type: "run", desc: "Running 35 min muy suave — DESCARGA. Piernas frescas." },
      { day: "Mar", type: "hybrid", desc: "Clase Hyrox (intensidad controlada)." },
      { day: "Mié", type: "strength", desc: "Movilidad + sled técnico, sin cargas altas." },
      { day: "Jue", type: "rest", desc: "Descanso total." },
      { day: "Vie", type: "run", desc: "Running 30 min Z2." },
      { day: "Sáb", type: "hybrid", desc: "Circuito ligero 2 rondas, sin presión de tiempo." },
    ],
  },
  {
    w: 10, phase: "2", startDate: "2026-06-15", dateLabel: "15–21 jun", load: 87,
    focus: "Simulación 8 km + estaciones 1–6",
    sessions: [
      { day: "Lun", type: "run", desc: "Running 55 min Z2." },
      { day: "Mar", type: "hybrid", desc: "Clase Hyrox/Hybrid." },
      { day: "Mié", type: "strength", desc: "Fuerza pesada + sled con peso competición + 3×15 burpee broad jumps." },
      { day: "Jue", type: "rest", desc: "Descanso activo." },
      { day: "Vie", type: "run", desc: "Tempo 40 min continuo o 4×8 min a umbral." },
      { day: "Sáb", type: "sim", desc: "<strong>Simulación:</strong> 8 km running + estaciones 1–6. Anota tiempos por segmento." },
    ],
  },
  {
    w: 11, phase: "2", startDate: "2026-06-22", dateLabel: "22–28 jun", load: 88,
    focus: "Volumen pico fase 2",
    sessions: [
      { day: "Lun", type: "run", desc: "Running 60 min Z2 + 4×strides." },
      { day: "Mar", type: "hybrid", desc: "Clase Hyrox/Hybrid." },
      { day: "Mié", type: "strength", desc: "Sled push+pull completo (pesos carrera) + row + ski erg." },
      { day: "Jue", type: "rest", desc: "Descanso." },
      { day: "Vie", type: "run", desc: "<strong>Intervalos:</strong> 8×1 km con 400m recuperación." },
      { day: "Sáb", type: "run", desc: "Running largo 75 min Z2 — mayor rodaje del plan." },
    ],
  },
  {
    w: 12, phase: "3", startDate: "2026-06-29", dateLabel: "29 jun–5 jul", load: 90,
    focus: "SIMULACIÓN COMPLETA 1", sim: true,
    sessions: [
      { day: "Lun", type: "run", desc: "Running 55 min Z2." },
      { day: "Mar", type: "hybrid", desc: "Clase Hyrox/Hybrid." },
      { day: "Mié", type: "strength", desc: "Fuerza + sled + sandbag lunges + wall balls encadenados." },
      { day: "Jue", type: "rest", desc: "Descanso activo — prepara la simulación del sábado." },
      { day: "Vie", type: "run", desc: "Tempo 35 min suave, sin forzar." },
      { day: "Sáb", type: "sim", desc: "<strong>SIMULACIÓN COMPLETA 1:</strong> 8×(1 km running + estación). Objetivo: terminar. Descubrir puntos débiles." },
    ],
  },
  {
    w: 13, phase: "3", startDate: "2026-07-06", dateLabel: "6–12 jul", load: 65,
    focus: "Recuperación post-simulación", descarga: true,
    sessions: [
      { day: "Lun", type: "run", desc: "Running 40 min fácil — recuperación activa post-simulación." },
      { day: "Mar", type: "hybrid", desc: "Clase Hyrox moderada." },
      { day: "Mié", type: "strength", desc: "Movilidad + sled ligero — no es una sesión de carga." },
      { day: "Jue", type: "rest", desc: "Descanso." },
      { day: "Vie", type: "run", desc: "Running 35 min Z2." },
      { day: "Sáb", type: "hybrid", desc: "Circuito 3 rondas sin presión de tiempo. Foco en forma." },
    ],
  },
  {
    w: 14, phase: "3", startDate: "2026-07-13", dateLabel: "13–19 jul", load: 88,
    focus: "Atacar puntos débiles identificados",
    sessions: [
      { day: "Lun", type: "run", desc: "Running 60 min Z2." },
      { day: "Mar", type: "hybrid", desc: "Clase Hyrox/Hybrid." },
      { day: "Mié", type: "strength", desc: "Sled pesado + burpee broad jumps + farmers carry. Atacar lo que falló en S12." },
      { day: "Jue", type: "rest", desc: "Descanso." },
      { day: "Vie", type: "run", desc: "<strong>Intervalos:</strong> 6×1 km a ritmo objetivo carrera." },
      { day: "Sáb", type: "hybrid", desc: "Running 65 min Z2 + 4 estaciones más débiles al acabar." },
    ],
  },
  {
    w: 15, phase: "3", startDate: "2026-07-20", dateLabel: "20–26 jul", load: 90,
    focus: "SIMULACIÓN COMPLETA 2 · cronometrada", sim: true,
    sessions: [
      { day: "Lun", type: "run", desc: "Running 60 min Z2." },
      { day: "Mar", type: "hybrid", desc: "Clase Hyrox/Hybrid — alta intensidad." },
      { day: "Mié", type: "strength", desc: "Fuerza + sled + sandbag + wall balls. Último bloque duro antes de la sim." },
      { day: "Jue", type: "rest", desc: "Descanso activo." },
      { day: "Vie", type: "run", desc: "Tempo 35 min suave." },
      { day: "Sáb", type: "sim", desc: "<strong>SIMULACIÓN COMPLETA 2:</strong> Cronometrada. Anota splits por estación. Aplica estrategia de pace." },
    ],
  },
  {
    w: 16, phase: "3", startDate: "2026-07-27", dateLabel: "27 jul–2 ago", load: 68,
    focus: "Recuperación y ajuste de estrategia", descarga: true,
    sessions: [
      { day: "Lun", type: "run", desc: "Running 40 min fácil." },
      { day: "Mar", type: "hybrid", desc: "Clase Hyrox moderada." },
      { day: "Mié", type: "strength", desc: "Sled técnico + movilidad — sin carga alta." },
      { day: "Jue", type: "rest", desc: "Descanso." },
      { day: "Vie", type: "run", desc: "Running 35 min Z2." },
      { day: "Sáb", type: "hybrid", desc: "Circuito ajustado según errores detectados en S15." },
    ],
  },
  {
    w: 17, phase: "3", startDate: "2026-08-03", dateLabel: "3–9 ago", load: 88,
    focus: "Último bloque de volumen alto",
    sessions: [
      { day: "Lun", type: "run", desc: "Running 55 min Z2." },
      { day: "Mar", type: "hybrid", desc: "Clase Hyrox/Hybrid." },
      { day: "Mié", type: "strength", desc: "Sled push+pull (peso carrera) + row + ski erg encadenados." },
      { day: "Jue", type: "rest", desc: "Descanso." },
      { day: "Vie", type: "run", desc: "<strong>Intervalos:</strong> 6×1 km." },
      { day: "Sáb", type: "hybrid", desc: "Running 65 min Z2 + 3 estaciones más débiles post-run." },
    ],
  },
  {
    w: 18, phase: "3", startDate: "2026-08-10", dateLabel: "10–16 ago", load: 82,
    focus: "SIMULACIÓN COMPLETA 3 · últimas correcciones", sim: true,
    sessions: [
      { day: "Lun", type: "run", desc: "Running 50 min Z2." },
      { day: "Mar", type: "hybrid", desc: "Clase Hyrox/Hybrid." },
      { day: "Mié", type: "strength", desc: "Fuerza + sled + wall balls 3×20. Última sesión intensa del plan." },
      { day: "Jue", type: "rest", desc: "Descanso activo." },
      { day: "Vie", type: "run", desc: "Tempo 30 min + 2 km a ritmo carrera." },
      { day: "Sáb", type: "sim", desc: "<strong>SIMULACIÓN COMPLETA 3:</strong> Últimas correcciones. Afinar estrategia de wall balls y transiciones." },
    ],
  },
  {
    w: 19, phase: "taper", startDate: "2026-08-17", dateLabel: "17–23 ago", load: 50,
    focus: "Taper · volumen –40%", descarga: true,
    sessions: [
      { day: "Lun", type: "run", desc: "Running 30 min fácil." },
      { day: "Mar", type: "hybrid", desc: "Clase Hyrox (volumen –40%, mantener algo de intensidad)." },
      { day: "Mié", type: "strength", desc: "Sled ligero técnico + movilidad." },
      { day: "Jue", type: "rest", desc: "Descanso." },
      { day: "Vie", type: "run", desc: "Running 25 min con 3×1 km a ritmo carrera intercalados." },
      { day: "Sáb", type: "hybrid", desc: "Circuito corto 1 ronda + práctica de transiciones." },
    ],
  },
  {
    w: 20, phase: "taper", startDate: "2026-08-24", dateLabel: "24–30 ago", load: 30,
    focus: "Taper profundo · llegar fresco",
    sessions: [
      { day: "Lun", type: "run", desc: "Running 20 min Z2." },
      { day: "Mar", type: "hybrid", desc: "Clase Hyrox suave o circuito 45 min." },
      { day: "Mié", type: "rest", desc: "Movilidad + foam rolling." },
      { day: "Jue", type: "rest", desc: "Descanso." },
      { day: "Vie", type: "run", desc: "10 min trote + 4×100m a ritmo carrera — activar piernas." },
      { day: "Sáb", type: "rest", desc: "Descanso o paseo tranquilo." },
    ],
  },
  {
    w: 21, phase: "taper", startDate: "2026-08-31", dateLabel: "31 ago–5 sep", load: 15,
    focus: "Race week · Hyrox Tenerife", raceDay: true,
    sessions: [
      { day: "Lun", type: "run", desc: "Running 15 min muy suave." },
      { day: "Mar", type: "rest", desc: "Movilidad + estiramientos." },
      { day: "Mié", type: "rest", desc: "Descanso total." },
      { day: "Jue", type: "run", desc: "10 min trote muy suave — activar sin cansar." },
      { day: "Vie", type: "rest", desc: "<strong>Prepara material, come bien, duerme 8h.</strong> Llega al Recinto Ferial 90 min antes." },
      { day: "Sáb", type: "sim", desc: "<strong>RACE DAY — HYROX TENERIFE · 5 sep 2026</strong> · Recinto Ferial, Av. Constitución 12." },
    ],
  },
];

const DAY_CODES: HyroxDayCode[] = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

const DAY_OFFSETS: Record<HyroxDayCode, number> = {
  Lun: 0,
  Mar: 1,
  "Mié": 2,
  Jue: 3,
  Vie: 4,
  "Sáb": 5,
};

// JS getDay(): 0=Sun, 1=Mon, ..., 6=Sat. Map 1..6 to Lun..Sáb; null for Sun.
export function dayCodeFromDate(date: Date): HyroxDayCode | null {
  const dow = date.getDay();
  if (dow === 0) return null;
  return DAY_CODES[dow - 1] ?? null;
}

// Calendar date (yyyy-mm-dd) of a given session within a week.
export function getSessionDateIso(week: HyroxWeek, day: HyroxDayCode): string {
  const start = new Date(week.startDate + "T00:00:00");
  start.setDate(start.getDate() + DAY_OFFSETS[day]);
  return isoDate(start);
}

const MONTHS_ES = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

// Human label like "lun 11 may"
export function getSessionDateLabel(week: HyroxWeek, day: HyroxDayCode): string {
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
export function getWeekForDate(date: Date): HyroxWeek | null {
  const iso = isoDate(date);
  if (iso < HYROX_PLAN_START || iso > HYROX_RACE_DATE) return null;
  const days = daysBetween(HYROX_PLAN_START, iso);
  const idx = Math.floor(days / 7);
  return HYROX_WEEKS[Math.min(idx, HYROX_WEEKS.length - 1)] ?? null;
}

export function getSessionForDate(
  date: Date,
): { week: HyroxWeek; session: HyroxSession } | null {
  const week = getWeekForDate(date);
  if (!week) return null;
  const code = dayCodeFromDate(date);
  if (!code) return null;
  const session = week.sessions.find((s) => s.day === code);
  if (!session) return null;
  return { week, session };
}

export function daysUntilRace(today: Date): number {
  return daysBetween(isoDate(today), HYROX_RACE_DATE);
}
