import Anthropic from "@anthropic-ai/sdk";
import type { Tool } from "@anthropic-ai/sdk/resources/messages";
import { createClient } from "@/lib/supabase/server";

const anthropic = new Anthropic();
const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 2048;

const draftRecipeTool: Tool = {
  name: "draft_recipe",
  description:
    "Devuelve la receta estructurada al usuario. SIEMPRE invoca esta tool con todos los campos calculados.",
  input_schema: {
    type: "object" as const,
    properties: {
      title: { type: "string", description: "Nombre corto y claro" },
      subtitle: {
        type: "string",
        description: "Una línea descriptiva (ingredientes principales o estilo)",
      },
      tags: {
        type: "array",
        items: {
          type: "string",
          enum: [
            "protein",
            "quick",
            "fresh",
            "warm",
            "meal_prep",
            "snack",
            "side",
            "light",
          ],
        },
        description: "Solo tags de la lista permitida",
      },
      ingredients: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            qty: { type: "number" },
            unit: {
              type: "string",
              description: "g, ml, kg, l, unidad, unidades, rebanadas, dientes, cubos…",
            },
          },
          required: ["name", "qty", "unit"],
        },
      },
      steps: {
        type: "string",
        description: "Pasos numerados separados por números: '1. ... 2. ... 3. ...'",
      },
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
      pairing_notes: {
        type: "string",
        description: "Cuándo encaja este plato (entreno, descanso, snack, etc.)",
      },
    },
    required: [
      "title",
      "subtitle",
      "tags",
      "ingredients",
      "steps",
      "macros",
      "servings",
      "prep_time_min",
    ],
  },
};

const SYSTEM_PROMPT = `Eres un nutricionista que diseña recetas para una webapp de tracking nutricional (NutriTrack). Recetas en español.

REGLAS:
1. Macros realistas y coherentes: 4*proteína + 4*carbos + 9*grasa ≈ kcal (margen ±10%).
2. Ingredientes con cantidades concretas (g/ml/unidad). Una ingrediente por línea, sin repetir.
3. Pasos numerados ("1. ... 2. ... 3. ..."), claros y breves.
4. Tags solo de: protein, quick, fresh, warm, meal_prep, snack, side, light. No inventes tags.
5. servings indica cuántas raciones produce la receta y macros son POR RACIÓN.
6. prep_time_min en minutos totales (preparación + cocción).
7. pairing_notes breve, indicando cuándo encaja (día entreno, descanso, snack, etc.).
8. Si el usuario menciona restricciones (sin pescado, etc.), respétalas estrictamente.
9. Devuelve la receta SIEMPRE invocando draft_recipe — no escribas texto fuera de la tool.`;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const prompt = body.prompt as string | undefined;
    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return Response.json({ error: "prompt is required" }, { status: 400 });
    }

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT,
      tools: [draftRecipeTool],
      tool_choice: { type: "tool", name: "draft_recipe" },
      messages: [{ role: "user", content: prompt.trim() }],
    });

    const toolUse = response.content.find(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
    );
    if (!toolUse) {
      return Response.json(
        { error: "El modelo no devolvió una receta estructurada" },
        { status: 500 }
      );
    }

    return Response.json({ recipe: toolUse.input });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Generate recipe error:", message);
    return Response.json({ error: `Error: ${message}` }, { status: 500 });
  }
}
