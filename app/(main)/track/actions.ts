"use server";

import { createClient } from "@/lib/supabase/server";

export async function getTrackingSummary() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoStr = weekAgo.toISOString().split("T")[0];

  const [weightResult, workoutResult] = await Promise.all([
    supabase
      .from("weight_logs")
      .select("date, weight_kg")
      .eq("user_id", user.id)
      .gte("date", weekAgoStr)
      .order("date", { ascending: false }),
    supabase
      .from("workout_logs")
      .select("date, type, duration_min, fatigue, notes")
      .eq("user_id", user.id)
      .gte("date", new Date(weekAgo).toISOString())
      .order("date", { ascending: false }),
  ]);

  const weights = weightResult.data ?? [];
  // Skipped sessions and planned (not-yet-done) replacements are not real
  // completed workouts — exclude them from totals/averages.
  const workouts = (workoutResult.data ?? []).filter((w) => {
    const notes: string = w.notes ?? "";
    return !notes.includes("[SALTADA]") && !notes.includes("[REEMPLAZO_PLAN]");
  });

  const lastWeight = weights[0] ? Number(weights[0].weight_kg) : null;
  const weightTrend =
    weights.length >= 2
      ? Number(weights[0].weight_kg) - Number(weights[weights.length - 1].weight_kg)
      : null;

  const totalWorkouts = workouts.length;
  const totalMinutes = workouts.reduce((s, w) => s + w.duration_min, 0);
  const avgFatigue =
    workouts.length > 0
      ? workouts.reduce((s, w) => s + w.fatigue, 0) / workouts.length
      : null;

  return {
    lastWeight,
    weightTrend,
    totalWorkouts,
    totalMinutes,
    avgFatigue,
  };
}
