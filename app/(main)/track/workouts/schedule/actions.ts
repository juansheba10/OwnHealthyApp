"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { WorkoutType } from "@/lib/types";

export async function getSchedule(startDate: string, endDate: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("workout_plans")
    .select("*")
    .eq("user_id", user.id)
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date");

  return data ?? [];
}

export interface PlannedSessionInput {
  date: string;
  type: WorkoutType;
  intended_intensity: number | null;
  notes: string | null;
}

export async function addPlannedSession(input: PlannedSessionInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("workout_plans").insert({
    user_id: user.id,
    date: input.date,
    type: input.type,
    intended_intensity: input.intended_intensity,
    notes: input.notes,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/track/workouts/schedule");
}

export async function deletePlannedSession(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("workout_plans")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/track/workouts/schedule");
}
