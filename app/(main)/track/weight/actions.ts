"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getWeightLogs(limit: number = 90) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data } = await supabase
    .from("weight_logs")
    .select("*")
    .eq("user_id", user.id)
    .order("date", { ascending: true })
    .limit(limit);

  return data ?? [];
}

export async function addWeightLog(weight: number, notes?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const today = new Date().toISOString().split("T")[0];

  const { error } = await supabase.from("weight_logs").upsert(
    {
      user_id: user.id,
      date: today,
      weight_kg: weight,
      notes: notes || null,
    },
    { onConflict: "user_id,date" }
  );

  if (error) throw new Error(error.message);
  revalidatePath("/track");
  revalidatePath("/track/weight");
}

export async function deleteWeightLog(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("weight_logs").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/track/weight");
}
