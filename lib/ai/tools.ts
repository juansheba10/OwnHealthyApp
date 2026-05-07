import { createClient } from "@supabase/supabase-js";
import type { Tool } from "@anthropic-ai/sdk/resources/messages";

// Use service role client for AI tools (bypasses RLS)
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Tools that mutate state — must be confirmed by the user before executing.
export const WRITE_TOOLS = new Set([
  "update_meal",
  "update_calorie_target",
  "add_recipe",
  "generate_weekly_plan",
]);

export function summarizeToolCall(
  name: string,
  input: Record<string, unknown>
): { title: string; summary: string } {
  switch (name) {
    case "update_meal": {
      const meal = (input.new_meal ?? {}) as Record<string, unknown>;
      const kcal = meal.kcal ? `${meal.kcal} kcal` : "";
      const protein = meal.protein ? `${meal.protein}g proteína` : "";
      const macros = [kcal, protein].filter(Boolean).join(" · ");
      return {
        title: "Sustituir comida",
        summary: `${input.date} · comida #${
          (input.meal_index as number) + 1
        } → "${meal.name ?? "(sin nombre)"}"${macros ? ` (${macros})` : ""}`,
      };
    }
    case "update_calorie_target":
      return {
        title: "Ajustar objetivo calórico",
        summary: `${input.day_type}: ${input.new_target} kcal — ${input.reason}`,
      };
    case "add_recipe": {
      const macros = (input.macros ?? {}) as Record<string, unknown>;
      const kcal = macros.kcal ? ` (${macros.kcal} kcal/ración)` : "";
      return {
        title: "Añadir receta",
        summary: `"${input.title}"${kcal}`,
      };
    }
    case "generate_weekly_plan": {
      const days = (input.days ?? []) as Array<{
        date: string;
        total_kcal?: number;
      }>;
      const dates = days.map((d) => d.date).sort();
      const total = days.reduce((s, d) => s + (d.total_kcal ?? 0), 0);
      const avg = days.length > 0 ? Math.round(total / days.length) : 0;
      const range =
        dates.length > 0 ? ` · ${dates[0]} → ${dates[dates.length - 1]}` : "";
      const avgStr = avg ? ` · promedio ${avg} kcal/día` : "";
      return {
        title: "Generar plan semanal",
        summary: `${days.length} días${range}${avgStr}`,
      };
    }
    default:
      return {
        title: name,
        summary: JSON.stringify(input),
      };
  }
}

export const toolDefinitions: Tool[] = [
  {
    name: "get_user_stats",
    description:
      "Lee estadísticas del usuario: peso reciente, entrenamientos, fatiga, adherencia al plan. Usa esto SIEMPRE antes de dar consejos.",
    input_schema: {
      type: "object" as const,
      properties: {
        user_id: { type: "string", description: "ID del usuario" },
        days: {
          type: "number",
          description: "Número de días hacia atrás (default 7)",
        },
      },
      required: ["user_id"],
    },
  },
  {
    name: "update_meal",
    description:
      "Sustituye una comida específica del plan de un día. Requiere confirmación del usuario.",
    input_schema: {
      type: "object" as const,
      properties: {
        user_id: { type: "string", description: "ID del usuario" },
        date: { type: "string", description: "Fecha del plan (YYYY-MM-DD)" },
        meal_index: {
          type: "number",
          description: "Índice de la comida a sustituir (0-based)",
        },
        new_meal: {
          type: "object",
          description: "Nueva comida",
          properties: {
            time: { type: "string" },
            label: { type: "string" },
            name: { type: "string" },
            items: { type: "array", items: { type: "string" } },
            kcal: { type: "number" },
            protein: { type: "number" },
          },
          required: ["time", "label", "name", "items", "kcal"],
        },
      },
      required: ["user_id", "date", "meal_index", "new_meal"],
    },
  },
  {
    name: "update_calorie_target",
    description:
      "Ajusta el objetivo calórico del usuario. Requiere confirmación.",
    input_schema: {
      type: "object" as const,
      properties: {
        user_id: { type: "string", description: "ID del usuario" },
        day_type: {
          type: "string",
          enum: ["training", "rest", "double", "football_only"],
          description: "Tipo de día a ajustar",
        },
        new_target: { type: "number", description: "Nuevo objetivo en kcal" },
        reason: { type: "string", description: "Razón del ajuste" },
      },
      required: ["user_id", "day_type", "new_target", "reason"],
    },
  },
  {
    name: "add_recipe",
    description: "Añade una nueva receta al catálogo.",
    input_schema: {
      type: "object" as const,
      properties: {
        title: { type: "string" },
        subtitle: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
        ingredients: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              qty: { type: "number" },
              unit: { type: "string" },
            },
            required: ["name", "qty", "unit"],
          },
        },
        steps: { type: "string" },
        macros: {
          type: "object",
          properties: {
            kcal: { type: "number" },
            protein: { type: "number" },
            carbs: { type: "number" },
            fat: { type: "number" },
          },
          required: ["kcal", "protein", "carbs", "fat"],
        },
        servings: { type: "number" },
        prep_time_min: { type: "number" },
      },
      required: ["title", "ingredients", "macros"],
    },
  },
  {
    name: "analyze_progress",
    description:
      "Analiza el progreso del usuario comparando peso, entrenos y adherencia contra sus objetivos. Devuelve un diagnóstico completo.",
    input_schema: {
      type: "object" as const,
      properties: {
        user_id: { type: "string", description: "ID del usuario" },
      },
      required: ["user_id"],
    },
  },
  {
    name: "get_training_schedule",
    description:
      "Lee el calendario de entrenos planificados del usuario en un rango de fechas. Úsalo SIEMPRE antes de generar un plan semanal.",
    input_schema: {
      type: "object" as const,
      properties: {
        user_id: { type: "string" },
        start_date: { type: "string", description: "YYYY-MM-DD" },
        end_date: { type: "string", description: "YYYY-MM-DD" },
      },
      required: ["user_id", "start_date", "end_date"],
    },
  },
  {
    name: "list_recipes",
    description:
      "Lista las recetas disponibles en el catálogo. Úsalo antes de generar un plan para componer comidas a partir de recetas reales (no inventes recetas que no existen). Filtros opcionales por tags, kcal máximas o proteína mínima.",
    input_schema: {
      type: "object" as const,
      properties: {
        tags: {
          type: "array",
          items: { type: "string" },
          description:
            "Tags a filtrar (la receta debe contener TODOS los tags listados)",
        },
        max_kcal: {
          type: "number",
          description: "Calorías máximas por ración",
        },
        min_protein: {
          type: "number",
          description: "Proteína mínima en gramos por ración",
        },
      },
    },
  },
  {
    name: "generate_weekly_plan",
    description:
      "Genera (o reemplaza) el plan semanal de comidas del usuario. Sustituye los planes existentes en cada fecha incluida (upsert por user_id+date). Requiere confirmación. ANTES de invocar esta tool: (1) lee el training schedule del rango, (2) lee weight_logs y workout_logs recientes para detectar tendencias, (3) lista recetas disponibles, (4) en tu mensaje al usuario antes de invocar, expón día a día qué propones y por qué.",
    input_schema: {
      type: "object" as const,
      properties: {
        user_id: { type: "string" },
        start_date: {
          type: "string",
          description: "Primer día del plan (YYYY-MM-DD)",
        },
        days: {
          type: "array",
          description:
            "Una entrada por día. Típicamente 7 fechas consecutivas desde start_date.",
          items: {
            type: "object",
            properties: {
              date: { type: "string", description: "YYYY-MM-DD" },
              day_type: {
                type: "string",
                enum: ["training", "rest", "double", "football_only"],
              },
              meals: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    time: { type: "string", description: "HH:MM" },
                    label: { type: "string" },
                    name: { type: "string" },
                    items: {
                      type: "array",
                      items: { type: "string" },
                    },
                    kcal: { type: "number" },
                    protein: { type: "number" },
                    recipe_id: { type: "string" },
                  },
                  required: ["time", "label", "name", "items", "kcal"],
                },
              },
              total_kcal: { type: "number" },
              total_protein: { type: "number" },
              notes: { type: "string" },
            },
            required: [
              "date",
              "day_type",
              "meals",
              "total_kcal",
              "total_protein",
            ],
          },
        },
      },
      required: ["user_id", "start_date", "days"],
    },
  },
];

// Tool execution functions
export async function executeTool(
  name: string,
  input: Record<string, unknown>
): Promise<string> {
  switch (name) {
    case "get_user_stats":
      return await getUserStats(
        input.user_id as string,
        (input.days as number) ?? 7
      );
    case "update_meal":
      return await updateMeal(
        input.user_id as string,
        input.date as string,
        input.meal_index as number,
        input.new_meal as Record<string, unknown>
      );
    case "update_calorie_target":
      return await updateCalorieTarget(
        input.user_id as string,
        input.day_type as string,
        input.new_target as number,
        input.reason as string
      );
    case "add_recipe":
      return await addRecipe(input);
    case "analyze_progress":
      return await analyzeProgress(input.user_id as string);
    case "get_training_schedule":
      return await getTrainingSchedule(
        input.user_id as string,
        input.start_date as string,
        input.end_date as string
      );
    case "list_recipes":
      return await listRecipes(input);
    case "generate_weekly_plan":
      return await generateWeeklyPlan(
        input.user_id as string,
        input.start_date as string,
        input.days as Array<{
          date: string;
          day_type: string;
          meals: Record<string, unknown>[];
          total_kcal: number;
          total_protein: number;
          notes?: string;
        }>
      );
    default:
      return JSON.stringify({ error: `Unknown tool: ${name}` });
  }
}

async function getUserStats(userId: string, days: number): Promise<string> {
  const supabase = getAdminClient();
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceStr = since.toISOString().split("T")[0];

  const [profile, weights, workouts, plans] = await Promise.all([
    supabase
      .from("users")
      .select("name, calorie_targets, protein_target, restrictions, fasting_protocol")
      .eq("id", userId)
      .single(),
    supabase
      .from("weight_logs")
      .select("date, weight_kg, notes")
      .eq("user_id", userId)
      .gte("date", sinceStr)
      .order("date"),
    supabase
      .from("workout_logs")
      .select("date, type, duration_min, intensity, fatigue, notes")
      .eq("user_id", userId)
      .gte("date", since.toISOString())
      .order("date"),
    supabase
      .from("meal_plans")
      .select("date, day_type, total_kcal, total_protein, meals")
      .eq("user_id", userId)
      .gte("date", sinceStr)
      .order("date"),
  ]);

  return JSON.stringify({
    profile: profile.data,
    weight_logs: weights.data,
    workout_logs: workouts.data,
    meal_plans: plans.data,
    period: `últimos ${days} días`,
  });
}

async function updateMeal(
  userId: string,
  date: string,
  mealIndex: number,
  newMeal: Record<string, unknown>
): Promise<string> {
  const supabase = getAdminClient();

  const { data: plan } = await supabase
    .from("meal_plans")
    .select("id, meals, total_kcal, total_protein")
    .eq("user_id", userId)
    .eq("date", date)
    .single();

  if (!plan) return JSON.stringify({ error: "No hay plan para esa fecha" });

  const meals = plan.meals as Record<string, unknown>[];
  if (mealIndex < 0 || mealIndex >= meals.length) {
    return JSON.stringify({ error: "Índice de comida inválido" });
  }

  const oldMeal = meals[mealIndex];
  meals[mealIndex] = newMeal;

  const totalKcal = meals.reduce(
    (s, m) => s + ((m.kcal as number) ?? 0),
    0
  );
  const totalProtein = meals.reduce(
    (s, m) => s + ((m.protein as number) ?? 0),
    0
  );

  const { error } = await supabase
    .from("meal_plans")
    .update({ meals, total_kcal: totalKcal, total_protein: totalProtein })
    .eq("id", plan.id);

  if (error) return JSON.stringify({ error: error.message });

  // Log the change
  await supabase.from("change_log").insert({
    user_id: userId,
    action: "update_meal",
    details: { date, meal_index: mealIndex, old_meal: oldMeal, new_meal: newMeal },
  });

  return JSON.stringify({
    success: true,
    message: `Comida ${mealIndex + 1} del ${date} actualizada`,
    new_totals: { kcal: totalKcal, protein: totalProtein },
  });
}

async function updateCalorieTarget(
  userId: string,
  dayType: string,
  newTarget: number,
  reason: string
): Promise<string> {
  const supabase = getAdminClient();

  const { data: user } = await supabase
    .from("users")
    .select("calorie_targets")
    .eq("id", userId)
    .single();

  if (!user) return JSON.stringify({ error: "Usuario no encontrado" });

  const targets = user.calorie_targets as Record<string, number>;
  const oldTarget = targets[dayType];
  targets[dayType] = newTarget;

  const { error } = await supabase
    .from("users")
    .update({ calorie_targets: targets })
    .eq("id", userId);

  if (error) return JSON.stringify({ error: error.message });

  await supabase.from("change_log").insert({
    user_id: userId,
    action: "update_calorie_target",
    details: { day_type: dayType, old_target: oldTarget, new_target: newTarget, reason },
  });

  return JSON.stringify({
    success: true,
    message: `Objetivo calórico de ${dayType} cambiado de ${oldTarget} a ${newTarget} kcal. Razón: ${reason}`,
  });
}

async function addRecipe(
  input: Record<string, unknown>
): Promise<string> {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from("recipes")
    .insert({
      title: input.title,
      subtitle: input.subtitle ?? "",
      tags: input.tags ?? [],
      ingredients: input.ingredients ?? [],
      steps: input.steps ?? "",
      macros: input.macros ?? { kcal: 0, protein: 0, carbs: 0, fat: 0 },
      servings: input.servings ?? 1,
      prep_time_min: input.prep_time_min ?? 0,
    })
    .select("id, title")
    .single();

  if (error) return JSON.stringify({ error: error.message });

  await supabase.from("change_log").insert({
    user_id: input.user_id as string,
    action: "add_recipe",
    details: {
      recipe_id: data.id,
      title: data.title,
      tags: input.tags ?? [],
      macros: input.macros ?? null,
      servings: input.servings ?? 1,
    },
  });

  return JSON.stringify({
    success: true,
    message: `Receta "${data.title}" añadida al catálogo`,
    recipe_id: data.id,
  });
}

async function analyzeProgress(userId: string): Promise<string> {
  const supabase = getAdminClient();

  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
  const sinceStr = fourWeeksAgo.toISOString().split("T")[0];

  const [profile, weights, workouts] = await Promise.all([
    supabase
      .from("users")
      .select("name, calorie_targets, protein_target, profile")
      .eq("id", userId)
      .single(),
    supabase
      .from("weight_logs")
      .select("date, weight_kg")
      .eq("user_id", userId)
      .gte("date", sinceStr)
      .order("date"),
    supabase
      .from("workout_logs")
      .select("date, type, duration_min, intensity, fatigue")
      .eq("user_id", userId)
      .gte("date", fourWeeksAgo.toISOString())
      .order("date"),
  ]);

  const weightData = weights.data ?? [];
  const workoutData = workouts.data ?? [];

  const weightChange =
    weightData.length >= 2
      ? Number(weightData[weightData.length - 1].weight_kg) -
        Number(weightData[0].weight_kg)
      : null;

  const avgFatigue =
    workoutData.length > 0
      ? workoutData.reduce((s, w) => s + w.fatigue, 0) / workoutData.length
      : null;

  const weeklyWorkouts = workoutData.length / 4;

  return JSON.stringify({
    profile: profile.data,
    period: "últimas 4 semanas",
    weight: {
      entries: weightData.length,
      change_kg: weightChange,
      first: weightData[0]?.weight_kg,
      last: weightData[weightData.length - 1]?.weight_kg,
    },
    workouts: {
      total: workoutData.length,
      avg_per_week: Math.round(weeklyWorkouts * 10) / 10,
      avg_fatigue: avgFatigue ? Math.round(avgFatigue * 10) / 10 : null,
      by_type: workoutData.reduce(
        (acc, w) => {
          acc[w.type] = (acc[w.type] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),
    },
  });
}

async function getTrainingSchedule(
  userId: string,
  startDate: string,
  endDate: string
): Promise<string> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("workout_plans")
    .select("date, type, intended_intensity, notes")
    .eq("user_id", userId)
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date");

  if (error) return JSON.stringify({ error: error.message });

  return JSON.stringify({
    period: `${startDate} a ${endDate}`,
    sessions: data ?? [],
  });
}

async function listRecipes(
  filters: Record<string, unknown>
): Promise<string> {
  const supabase = getAdminClient();
  let query = supabase
    .from("recipes")
    .select(
      "id, title, subtitle, tags, macros, servings, prep_time_min, pairing_notes"
    );

  if (Array.isArray(filters.tags) && filters.tags.length > 0) {
    query = query.contains("tags", filters.tags as string[]);
  }

  const { data, error } = await query.order("title");
  if (error) return JSON.stringify({ error: error.message });

  let recipes = (data ?? []) as Array<{
    id: string;
    title: string;
    macros: Record<string, number>;
  }>;

  if (typeof filters.max_kcal === "number") {
    const max = filters.max_kcal as number;
    recipes = recipes.filter((r) => (r.macros?.kcal ?? Infinity) <= max);
  }
  if (typeof filters.min_protein === "number") {
    const min = filters.min_protein as number;
    recipes = recipes.filter((r) => (r.macros?.protein ?? 0) >= min);
  }

  return JSON.stringify({ count: recipes.length, recipes });
}

async function generateWeeklyPlan(
  userId: string,
  startDate: string,
  days: Array<{
    date: string;
    day_type: string;
    meals: Record<string, unknown>[];
    total_kcal: number;
    total_protein: number;
    notes?: string;
  }>
): Promise<string> {
  if (!Array.isArray(days) || days.length === 0) {
    return JSON.stringify({ error: "days no puede estar vacío" });
  }

  const supabase = getAdminClient();

  const rows = days.map((d) => ({
    user_id: userId,
    date: d.date,
    day_type: d.day_type,
    meals: d.meals,
    total_kcal: d.total_kcal,
    total_protein: d.total_protein,
    notes: d.notes ?? null,
  }));

  const { error } = await supabase
    .from("meal_plans")
    .upsert(rows, { onConflict: "user_id,date" });

  if (error) return JSON.stringify({ error: error.message });

  const dates = days.map((d) => d.date).sort();
  const avgKcal = Math.round(
    days.reduce((s, d) => s + (d.total_kcal ?? 0), 0) / days.length
  );

  await supabase.from("change_log").insert({
    user_id: userId,
    action: "generate_weekly_plan",
    details: {
      start_date: startDate,
      dates,
      day_count: days.length,
      avg_kcal: avgKcal,
    },
  });

  return JSON.stringify({
    success: true,
    message: `Plan generado: ${days.length} días (${dates[0]} → ${
      dates[dates.length - 1]
    }). Promedio ${avgKcal} kcal/día.`,
  });
}
