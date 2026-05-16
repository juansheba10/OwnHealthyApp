"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { MealItem, DayType, Ingredient, Macros } from "@/lib/types";

function formatIngredient(ing: Ingredient): string {
  if (ing.unit === "unidad" || ing.unit === "unidades") {
    return `${ing.qty} ${ing.name}`;
  }
  if (
    ing.unit === "g" ||
    ing.unit === "ml" ||
    ing.unit === "kg" ||
    ing.unit === "l"
  ) {
    return `${ing.qty}${ing.unit} ${ing.name}`;
  }
  return `${ing.qty} ${ing.unit} ${ing.name}`;
}

export async function getDayPlan(date: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("meal_plans")
    .select("*")
    .eq("user_id", user.id)
    .eq("date", date)
    .single();

  return data;
}

export async function updateDayType(planId: string, dayType: DayType) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("meal_plans")
    .update({ day_type: dayType })
    .eq("id", planId);

  if (error) throw new Error(error.message);
  revalidatePath("/plan");
}

export async function updateMeal(
  planId: string,
  mealIndex: number,
  updatedMeal: MealItem,
  meals: MealItem[],
) {
  const supabase = await createClient();

  const newMeals = [...meals];
  newMeals[mealIndex] = updatedMeal;

  const totalKcal = newMeals.reduce((sum, m) => sum + m.kcal, 0);
  const totalProtein = newMeals.reduce((sum, m) => sum + (m.protein ?? 0), 0);

  const { error } = await supabase
    .from("meal_plans")
    .update({
      meals: newMeals,
      total_kcal: totalKcal,
      total_protein: totalProtein,
    })
    .eq("id", planId);

  if (error) throw new Error(error.message);
  revalidatePath("/plan");
}

export async function deleteMeal(
  planId: string,
  mealIndex: number,
  meals: MealItem[],
) {
  const supabase = await createClient();

  const newMeals = meals.filter((_, i) => i !== mealIndex);
  const totalKcal = newMeals.reduce((sum, m) => sum + m.kcal, 0);
  const totalProtein = newMeals.reduce((sum, m) => sum + (m.protein ?? 0), 0);

  const { error } = await supabase
    .from("meal_plans")
    .update({
      meals: newMeals,
      total_kcal: totalKcal,
      total_protein: totalProtein,
    })
    .eq("id", planId);

  if (error) throw new Error(error.message);
  revalidatePath("/plan");
}

export async function addMeal(
  planId: string,
  meal: MealItem,
  meals: MealItem[],
) {
  const supabase = await createClient();

  const newMeals = [...meals, meal];
  const totalKcal = newMeals.reduce((sum, m) => sum + m.kcal, 0);
  const totalProtein = newMeals.reduce((sum, m) => sum + (m.protein ?? 0), 0);

  const { error } = await supabase
    .from("meal_plans")
    .update({
      meals: newMeals,
      total_kcal: totalKcal,
      total_protein: totalProtein,
    })
    .eq("id", planId);

  if (error) throw new Error(error.message);
  revalidatePath("/plan");
}

export async function addMealFromRecipe(
  planId: string,
  recipeId: string,
  time: string,
  label: string,
  meals: MealItem[],
): Promise<MealItem> {
  const supabase = await createClient();

  const { data: recipe, error: recipeError } = await supabase
    .from("recipes")
    .select("id, title, ingredients, macros")
    .eq("id", recipeId)
    .single();

  if (recipeError || !recipe) {
    throw new Error(recipeError?.message ?? "Receta no encontrada");
  }

  const ingredients = (recipe.ingredients as Ingredient[]) ?? [];
  const macros = (recipe.macros as Macros) ?? {
    kcal: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  };

  const meal: MealItem = {
    time,
    label,
    name: recipe.title,
    items: ingredients.map(formatIngredient),
    kcal: macros.kcal ?? 0,
    protein: macros.protein ?? 0,
    recipe_id: recipe.id,
  };

  const newMeals = [...meals, meal];
  const totalKcal = newMeals.reduce((sum, m) => sum + m.kcal, 0);
  const totalProtein = newMeals.reduce((sum, m) => sum + (m.protein ?? 0), 0);

  const { error } = await supabase
    .from("meal_plans")
    .update({
      meals: newMeals,
      total_kcal: totalKcal,
      total_protein: totalProtein,
    })
    .eq("id", planId);

  if (error) throw new Error(error.message);
  revalidatePath("/plan");

  return meal;
}
