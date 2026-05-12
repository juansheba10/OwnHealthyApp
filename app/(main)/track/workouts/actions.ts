"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { WorkoutType } from "@/lib/types";

export interface WorkoutLog {
  id: string;
  date: string;
  type: WorkoutType;
  duration_min: number;
  intensity: number;
  fatigue: number;
  notes: string | null;
}

export async function getWorkoutLogs(limit: number = 50) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data } = await supabase
    .from("workout_logs")
    .select("*")
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .limit(limit);

  // Exclude Hyrox status-only markers — [SALTADA] and [REEMPLAZADA] entries exist
  // solely so the Hyrox plan page can derive session status; they are not real
  // workout log entries and should not appear in the registro.
  return (data ?? []).filter((row) => {
    const notes: string = row.notes ?? "";
    return !notes.includes("[SALTADA]");
  });
}

export interface WorkoutInput {
  type: WorkoutType;
  duration_min: number;
  intensity: number;
  fatigue: number;
  notes?: string;
  date?: string;
}

export async function addWorkoutLog(input: WorkoutInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("workout_logs").insert({
    user_id: user.id,
    date: input.date ?? new Date().toISOString(),
    type: input.type,
    duration_min: input.duration_min,
    intensity: input.intensity,
    fatigue: input.fatigue,
    notes: input.notes || null,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/track");
  revalidatePath("/track/workouts");
}

export async function updateWorkoutLog(id: string, input: WorkoutInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const update: Record<string, unknown> = {
    type: input.type,
    duration_min: input.duration_min,
    intensity: input.intensity,
    fatigue: input.fatigue,
    notes: input.notes || null,
  };
  if (input.date) update.date = input.date;

  const { error } = await supabase
    .from("workout_logs")
    .update(update)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/track");
  revalidatePath("/track/workouts");
}

export async function deleteWorkoutLog(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("workout_logs").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/track/workouts");
}
