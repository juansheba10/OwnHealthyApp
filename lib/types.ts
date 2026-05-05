export type DayType = "training" | "rest" | "double" | "football_only";

export type WorkoutType =
  | "crossfit"
  | "hyrox"
  | "football"
  | "running"
  | "other";

export type Adherence = "followed" | "modified" | "skipped" | "extra";

export type ShoppingListStatus = "active" | "completed" | "archived";

export type ChatRole = "user" | "assistant" | "tool";

export interface Macros {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MealItem {
  time: string;
  label: string;
  name: string;
  items: string[];
  kcal: number;
  protein?: number;
  recipe_id?: string;
}

export interface Ingredient {
  name: string;
  qty: number;
  unit: string;
  optional?: boolean;
}

export interface ShoppingItem {
  name: string;
  qty: number;
  unit: string;
  category: string;
  checked: boolean;
  note?: string;
}

export interface UserProfile {
  edad: number;
  altura: number;
  peso: number;
  sexo: "M" | "F";
  nivel_actividad: string;
}

export interface CalorieTargets {
  training: number;
  rest: number;
  double: number;
  football_only: number;
}
