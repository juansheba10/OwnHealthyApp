"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Ingredient, Macros } from "@/lib/types";

export interface RecipeRow {
  id: string;
  title: string;
  subtitle: string;
  tags: string[];
  ingredients: Ingredient[];
  steps: string;
  macros: Macros;
  servings: number;
  prep_time_min: number;
  pairing_notes: string;
  created_by: string | null;
  is_favorite: boolean;
}

export async function getRecipes(): Promise<RecipeRow[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [recipesRes, favoritesRes] = await Promise.all([
    supabase.from("recipes").select("*").order("created_at", { ascending: false }),
    user
      ? supabase.from("recipe_favorites").select("recipe_id").eq("user_id", user.id)
      : Promise.resolve({ data: [] as { recipe_id: string }[] }),
  ]);

  const favorites = new Set((favoritesRes.data ?? []).map((r) => r.recipe_id));
  return (recipesRes.data ?? []).map((r) => ({
    ...r,
    is_favorite: favorites.has(r.id),
  })) as RecipeRow[];
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

export async function duplicateRecipe(id: string): Promise<RecipeRow> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: source, error: readErr } = await supabase
    .from("recipes")
    .select("*")
    .eq("id", id)
    .single();
  if (readErr || !source) throw new Error(readErr?.message ?? "Recipe not found");

  const {
    id: _id,
    created_at: _createdAt,
    created_by: _createdBy,
    title,
    ...rest
  } = source;
  void _id;
  void _createdAt;
  void _createdBy;

  const { data: copy, error: insertErr } = await supabase
    .from("recipes")
    .insert({ ...rest, title: `${title} (copia)`, created_by: user.id })
    .select()
    .single();
  if (insertErr || !copy) throw new Error(insertErr?.message ?? "Insert failed");

  revalidatePath("/recipes");
  return { ...copy, is_favorite: false } as RecipeRow;
}

export async function toggleFavorite(recipeId: string, favorite: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  if (favorite) {
    const { error } = await supabase
      .from("recipe_favorites")
      .insert({ user_id: user.id, recipe_id: recipeId });
    if (error && error.code !== "23505") throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from("recipe_favorites")
      .delete()
      .eq("user_id", user.id)
      .eq("recipe_id", recipeId);
    if (error) throw new Error(error.message);
  }
  revalidatePath("/recipes");
}
