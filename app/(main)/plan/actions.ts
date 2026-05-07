"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function deleteDayPlan(planId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { error } = await supabase
    .from("meal_plans")
    .delete()
    .eq("id", planId)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
  revalidatePath("/plan");
}

export async function getMealPlans(startDate: string, endDate: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { plans: [], profile: null };

  const [plansResult, profileResult] = await Promise.all([
    supabase
      .from("meal_plans")
      .select("*")
      .eq("user_id", user.id)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date"),
    supabase
      .from("users")
      .select("calorie_targets, protein_target")
      .eq("id", user.id)
      .single(),
  ]);

  return {
    plans: plansResult.data ?? [],
    profile: profileResult.data,
  };
}
