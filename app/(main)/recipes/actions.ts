"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Ingredient, Macros } from "@/lib/types";

export async function getRecipes() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("recipes")
    .select("*")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export interface RecipeInput {
  title: string;
  subtitle: string;
  tags: string[];
  ingredients: Ingredient[];
  steps: string;
  macros: Macros;
  servings: number;
  prep_time_min: number;
  pairing_notes: string;
}

export async function createRecipe(recipe: RecipeInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("recipes")
    .insert({ ...recipe, created_by: user.id });
  if (error) throw new Error(error.message);
  revalidatePath("/recipes");
}

export async function updateRecipe(id: string, recipe: Partial<RecipeInput>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("recipes").update(recipe).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/recipes");
}

export async function deleteRecipe(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("recipes").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/recipes");
}
