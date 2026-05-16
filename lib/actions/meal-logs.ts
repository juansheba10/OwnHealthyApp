"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { MealItem } from "@/lib/types";

export async function logPlannedMeal(
  planId: string,
  mealTime: string,
  snapshot: MealItem,
): Promise<{ id: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: plan, error: planError } = await supabase
    .from("meal_plans")
    .select("id, date, user_id")
    .eq("id", planId)
    .single();

  if (planError || !plan) {
    throw new Error(planError?.message ?? "Plan no encontrado");
  }
  if (plan.user_id !== user.id) {
    throw new Error("Plan no pertenece al usuario");
  }

  const { data, error } = await supabase
    .from("meal_logs")
    .insert({
      user_id: user.id,
      date: plan.date,
      meal_time: mealTime,
      planned_meal_id: plan.id,
      actual_meal: snapshot,
      adherence: "followed",
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/");
  return { id: data.id };
}

export async function unlogPlannedMeal(logId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("meal_logs")
    .delete()
    .eq("id", logId)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/");
}
