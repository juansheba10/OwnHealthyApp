"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  HYROX_WEEKS,
  getSessionDateIso,
  type HyroxDayCode,
  type HyroxSessionType,
} from "@/lib/hyrox/plan";
import type { WorkoutType } from "@/lib/types";

export type HyroxSessionStatus = "done" | "skipped" | "replaced";

interface SessionDefaults {
  workoutType: WorkoutType;
  duration_min: number;
  intensity: number;
  fatigue: number;
}

const DEFAULTS: Record<HyroxSessionType, SessionDefaults> = {
  run:      { workoutType: "running", duration_min: 35, intensity: 6, fatigue: 6 },
  hybrid:   { workoutType: "hyrox",   duration_min: 60, intensity: 8, fatigue: 7 },
  strength: { workoutType: "hyrox",   duration_min: 60, intensity: 7, fatigue: 7 },
  sim:      { workoutType: "hyrox",   duration_min: 80, intensity: 9, fatigue: 9 },
  rest:     { workoutType: "other",   duration_min: 20, intensity: 2, fatigue: 2 },
};

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, "");
}

function hyroxNotePrefix(weekNum: number, day: HyroxDayCode): string {
  return `Hyrox S${weekNum} · ${day}`;
}

function clamp500(s: string): string {
  return s.length > 500 ? s.slice(0, 497) + "..." : s;
}

function sessionTimestamp(weekNum: number, day: HyroxDayCode): string {
  const week = HYROX_WEEKS.find((w) => w.w === weekNum);
  if (!week) throw new Error("Semana no encontrada");
  const dateIso = getSessionDateIso(week, day);
  return `${dateIso}T12:00:00Z`;
}

async function getAuthedUserId(): Promise<{
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, userId: user.id };
}

function lookupSession(weekNum: number, day: HyroxDayCode) {
  const week = HYROX_WEEKS.find((w) => w.w === weekNum);
  if (!week) throw new Error("Semana no encontrada");
  const session = week.sessions.find((s) => s.day === day);
  if (!session) throw new Error("Sesión no encontrada");
  return { week, session };
}

function revalidateHyrox() {
  revalidatePath("/");
  revalidatePath("/hyrox");
  revalidatePath("/track");
  revalidatePath("/track/workouts");
}

export async function logHyroxSession(weekNum: number, day: HyroxDayCode) {
  const { supabase, userId } = await getAuthedUserId();
  const { week, session } = lookupSession(weekNum, day);
  const d = DEFAULTS[session.type];
  const note = clamp500(
    `${hyroxNotePrefix(week.w, day)} — ${stripHtml(session.desc)}`,
  );

  const { error } = await supabase.from("workout_logs").insert({
    user_id: userId,
    date: sessionTimestamp(week.w, day),
    type: d.workoutType,
    duration_min: d.duration_min,
    intensity: d.intensity,
    fatigue: d.fatigue,
    notes: note,
  });
  if (error) throw new Error(error.message);
  revalidateHyrox();
}

export async function skipHyroxSession(weekNum: number, day: HyroxDayCode) {
  const { supabase, userId } = await getAuthedUserId();
  const { week, session } = lookupSession(weekNum, day);
  const note = clamp500(
    `${hyroxNotePrefix(week.w, day)} [SALTADA] — ${stripHtml(session.desc)}`,
  );

  const { error } = await supabase.from("workout_logs").insert({
    user_id: userId,
    date: sessionTimestamp(week.w, day),
    type: "other",
    duration_min: 0,
    intensity: 1,
    fatigue: 1,
    notes: note,
  });
  if (error) throw new Error(error.message);
  revalidateHyrox();
}

export interface ReplaceHyroxInput {
  weekNum: number;
  day: HyroxDayCode;
  type: WorkoutType;
  duration_min: number;
  intensity: number;
  fatigue: number;
  notes?: string;
}

export async function replaceHyroxSession(input: ReplaceHyroxInput) {
  const { supabase, userId } = await getAuthedUserId();
  const { week } = lookupSession(input.weekNum, input.day);
  const userNote = (input.notes ?? "").trim();
  const note = clamp500(
    `${hyroxNotePrefix(week.w, input.day)} [REEMPLAZADA]${userNote ? " — " + userNote : ""}`,
  );

  const { error } = await supabase.from("workout_logs").insert({
    user_id: userId,
    date: sessionTimestamp(week.w, input.day),
    type: input.type,
    duration_min: input.duration_min,
    intensity: input.intensity,
    fatigue: input.fatigue,
    notes: note,
  });
  if (error) throw new Error(error.message);
  revalidateHyrox();
}

// Removes the Hyrox log for the given week/day from its planned date.
export async function undoHyroxSession(weekNum: number, day: HyroxDayCode) {
  const { supabase, userId } = await getAuthedUserId();
  const { week } = lookupSession(weekNum, day);
  const dateIso = getSessionDateIso(week, day);
  const prefix = hyroxNotePrefix(weekNum, day);

  const { data: rows } = await supabase
    .from("workout_logs")
    .select("id, notes, date")
    .eq("user_id", userId)
    .gte("date", `${dateIso}T00:00:00Z`)
    .lt("date", `${dateIso}T23:59:59Z`);

  const target = (rows ?? []).find((r) =>
    (r.notes ?? "").startsWith(prefix),
  );
  if (!target) return;

  const { error } = await supabase
    .from("workout_logs")
    .delete()
    .eq("id", target.id)
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  revalidateHyrox();
}
