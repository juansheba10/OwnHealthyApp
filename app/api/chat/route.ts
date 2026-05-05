import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { toolDefinitions, executeTool } from "@/lib/ai/tools";

const anthropic = new Anthropic();

// Service role client for reading user context
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function getUserContext(userId: string): Promise<string> {
  const supabase = getAdminClient();

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoStr = weekAgo.toISOString().split("T")[0];
  const today = new Date().toISOString().split("T")[0];

  const [profile, weights, workouts, todayPlan] = await Promise.all([
    supabase
      .from("users")
      .select("name, calorie_targets, protein_target, restrictions, fasting_protocol, profile")
      .eq("id", userId)
      .single(),
    supabase
      .from("weight_logs")
      .select("date, weight_kg")
      .eq("user_id", userId)
      .gte("date", weekAgoStr)
      .order("date", { ascending: false })
      .limit(7),
    supabase
      .from("workout_logs")
      .select("date, type, duration_min, intensity, fatigue")
      .eq("user_id", userId)
      .gte("date", weekAgo.toISOString())
      .order("date", { ascending: false })
      .limit(10),
    supabase
      .from("meal_plans")
      .select("date, day_type, meals, total_kcal, total_protein")
      .eq("user_id", userId)
      .eq("date", today)
      .single(),
  ]);

  return `
CONTEXTO DEL USUARIO:
- Perfil: ${JSON.stringify(profile.data)}
- Peso últimos 7 días: ${JSON.stringify(weights.data)}
- Entrenos últimos 7 días: ${JSON.stringify(workouts.data)}
- Plan de hoy (${today}): ${JSON.stringify(todayPlan.data)}
- Fecha actual: ${today}
- ID del usuario: ${userId}
`.trim();
}

const SYSTEM_PROMPT = `Eres el asistente nutricional de NutriTrack. Ayudas a los usuarios a gestionar su plan de comidas, tracking de peso y entrenamientos.

REGLAS:
1. SIEMPRE lee los datos reales del usuario con get_user_stats antes de dar consejos. NUNCA inventes datos.
2. Responde en español, de forma cercana y directa (tutea al usuario).
3. Cuando propongas cambios (sustituir comida, ajustar calorías), EXPLICA qué vas a hacer y POR QUÉ antes de ejecutar la tool.
4. Si el usuario pide algo que implica escribir en la base de datos, pide confirmación antes de ejecutar.
5. Sé conciso. No hagas listas largas a menos que te lo pidan.
6. Conoces las restricciones del usuario (sin pescado, etc.) — respétalas siempre.
7. Si no tienes datos suficientes, dilo honestamente. No improvises.
8. Cuando analices progreso, sé realista pero motivador.`;

export async function POST(request: Request) {
  try {
    const { messages, userId } = await request.json();

    if (!userId) {
      return Response.json({ error: "userId is required" }, { status: 400 });
    }

    // Load user context
    const userContext = await getUserContext(userId);

    // Build messages for Anthropic
    const anthropicMessages: Anthropic.MessageParam[] = messages.map(
      (m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })
    );

    // Insert user context into the first user message
    if (anthropicMessages.length > 0 && anthropicMessages[0].role === "user") {
      anthropicMessages[0] = {
        role: "user",
        content: `${userContext}\n\n---\n\nMensaje del usuario: ${anthropicMessages[0].content}`,
      };
    }

    // Initial API call
    let response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      tools: toolDefinitions,
      messages: anthropicMessages,
    });

    // Handle tool use loop
    const allMessages = [...anthropicMessages];

    while (response.stop_reason === "tool_use") {
      const assistantContent = response.content;
      allMessages.push({ role: "assistant", content: assistantContent });

      const toolResults: Anthropic.ToolResultBlockParam[] = [];

      for (const block of assistantContent) {
        if (block.type === "tool_use") {
          const result = await executeTool(
            block.name,
            block.input as Record<string, unknown>
          );
          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: result,
          });
        }
      }

      allMessages.push({ role: "user", content: toolResults });

      response = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        tools: toolDefinitions,
        messages: allMessages,
      });
    }

    // Extract text response
    const textContent = response.content.find((b) => b.type === "text");
    const reply = textContent ? textContent.text : "No pude generar una respuesta.";

    // Save messages to DB
    const supabase = getAdminClient();
    const lastUserMessage = messages[messages.length - 1];
    await supabase.from("chat_messages").insert([
      {
        user_id: userId,
        role: "user",
        content: { text: lastUserMessage.content },
      },
      {
        user_id: userId,
        role: "assistant",
        content: { text: reply },
        tool_calls: response.content.some((b) => b.type === "tool_use")
          ? response.content.filter((b) => b.type === "tool_use")
          : null,
      },
    ]);

    return Response.json({ reply });
  } catch (error) {
    console.error("Chat API error:", error);
    return Response.json(
      { error: "Error procesando el mensaje" },
      { status: 500 }
    );
  }
}
