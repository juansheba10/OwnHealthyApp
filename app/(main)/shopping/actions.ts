"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { aggregateShoppingList } from "@/lib/utils/shopping";
import type { ShoppingItem } from "@/lib/types";

export async function getActiveShoppingList() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("shopping_lists")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  return data;
}

export async function generateShoppingList(days: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const today = new Date();
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + days);

  const startStr = today.toISOString().split("T")[0];
  const endStr = endDate.toISOString().split("T")[0];

  // Get meal plans for the period
  const { data: plans } = await supabase
    .from("meal_plans")
    .select("id, meals")
    .eq("user_id", user.id)
    .gte("date", startStr)
    .lte("date", endStr);

  if (!plans || plans.length === 0) {
    throw new Error("No hay plan de comidas para este período");
  }

  const items = aggregateShoppingList(plans);

  // Archive existing active lists
  await supabase
    .from("shopping_lists")
    .update({ status: "archived" })
    .eq("user_id", user.id)
    .eq("status", "active");

  // Create new list
  const { data, error } = await supabase
    .from("shopping_lists")
    .insert({
      user_id: user.id,
      period_start: startStr,
      period_end: endStr,
      items,
      status: "active",
      generated_from: plans.map((p) => p.id),
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/shopping");
  return data;
}

export async function toggleItem(
  listId: string,
  itemIndex: number,
  items: ShoppingItem[],
) {
  const supabase = await createClient();

  const newItems = [...items];
  newItems[itemIndex] = {
    ...newItems[itemIndex],
    checked: !newItems[itemIndex].checked,
  };

  const { error } = await supabase
    .from("shopping_lists")
    .update({ items: newItems })
    .eq("id", listId);

  if (error) throw new Error(error.message);
}
