"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getUserProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  return data;
}

export async function updateProfile(updates: {
  protein_target?: number;
  restrictions?: string[];
  fasting_protocol?: string | null;
  calorie_targets?: {
    training: number;
    rest: number;
    double: number;
    football_only: number;
  };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/settings");
}

export async function exportUserData() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const [profile, weights, workouts, plans, recipes] = await Promise.all([
    supabase.from("users").select("*").eq("id", user.id).single(),
    supabase
      .from("weight_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("date"),
    supabase
      .from("workout_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("date"),
    supabase
      .from("meal_plans")
      .select("*")
      .eq("user_id", user.id)
      .order("date"),
    supabase.from("recipes").select("*").order("title"),
  ]);

  return {
    exported_at: new Date().toISOString(),
    profile: profile.data,
    weight_logs: weights.data,
    workout_logs: workouts.data,
    meal_plans: plans.data,
    recipes: recipes.data,
  };
}
