import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import {
  toolDefinitions,
  executeTool,
  WRITE_TOOLS,
  summarizeToolCall,
} from "@/lib/ai/tools";
import { signState, verifyState } from "@/lib/ai/state-token";

const anthropic = new Anthropic();
const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 8192;

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
      .select(
        "name, calorie_targets, protein_target, restrictions, fasting_protocol, profile"
      )
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

REGLAS GENERALES:
1. SIEMPRE lee los datos reales del usuario con get_user_stats antes de dar consejos. NUNCA inventes datos.
2. Responde en español, de forma cercana y directa (tutea al usuario).
3. Cuando propongas cambios (sustituir comida, ajustar calorías, generar plan), EXPLICA qué vas a hacer y POR QUÉ antes de invocar la tool. La aplicación le pedirá confirmación al usuario antes de aplicarlos.
4. Sé conciso. No hagas listas largas a menos que te lo pidan.
5. Conoces las restricciones del usuario (sin pescado, etc.) — respétalas siempre.
6. Si no tienes datos suficientes, dilo honestamente. No improvises.
7. Cuando analices progreso, sé realista pero motivador.
8. Si una tool devuelve "Usuario canceló la operación", reconoce el rechazo con naturalidad y ofrece alternativas si tiene sentido.

GENERACIÓN DE PLAN SEMANAL:
Cuando el usuario pida generar un plan (ej. "haz mi plan de la semana que viene"):
1. Usa get_training_schedule para leer el calendario de entrenos planificado en el rango destino.
2. Usa get_user_stats con days=14 para ver tendencias recientes de peso y fatiga de entrenos.
3. Usa list_recipes para conocer el catálogo disponible y componer comidas a partir de recetas reales.
4. Deriva day_type de cada fecha:
   - 0 sesiones planificadas → "rest"
   - 1 sesión y es football → "football_only"
   - 2+ sesiones → "double"
   - 1 sesión que no sea football → "training"
5. Ajusta el target calórico de cada día respecto al base de calorie_targets[day_type] según señales:
   - Si el peso está bajando más rápido de lo esperado o la fatiga media es ≥7/10 últimos 7 días → +150–250 kcal.
   - Si el peso está estancado y la adherencia es alta → mantén o reduce ligeramente.
   - Razona el ajuste explícitamente al usuario.
6. Respeta restricciones (sin pescado, etc.) en cada comida.
7. Para el horario de comidas usa el fasting_protocol del usuario (16:8 → primera comida sobre las 13:00, última sobre las 21:00).
8. Antes de invocar generate_weekly_plan, expón en el chat un resumen día a día (fecha, day_type, kcal totales y comidas clave) y razona el ajuste calórico. Solo entonces invoca la tool — la app gestiona la confirmación.`;

type ChatState = {
  messages: Anthropic.MessageParam[];
  pendingToolUses: Array<{
    id: string;
    name: string;
    input: Record<string, unknown>;
  }>;
  toolResults: Anthropic.ToolResultBlockParam[];
  userId: string;
  lastUserText: string;
};

type ProcessResult =
  | { kind: "reply"; text: string }
  | {
      kind: "needs_confirmation";
      pendingConfirmation: {
        toolName: string;
        title: string;
        summary: string;
        assistantText?: string;
      };
      state: ChatState;
    };

function extractAssistantText(
  content: Anthropic.MessageParam["content"]
): string | undefined {
  if (typeof content === "string") return content || undefined;
  const block = content.find(
    (b): b is Anthropic.TextBlockParam => b.type === "text"
  );
  return block?.text || undefined;
}

async function runLoop(state: ChatState): Promise<ProcessResult> {
  while (true) {
    while (state.pendingToolUses.length > 0) {
      const tu = state.pendingToolUses[0];
      if (WRITE_TOOLS.has(tu.name)) {
        const lastMsg = state.messages[state.messages.length - 1];
        const assistantText =
          lastMsg?.role === "assistant"
            ? extractAssistantText(lastMsg.content)
            : undefined;
        return {
          kind: "needs_confirmation",
          pendingConfirmation: {
            toolName: tu.name,
            ...summarizeToolCall(tu.name, tu.input),
            assistantText,
          },
          state,
        };
      }
      const result = await executeTool(tu.name, tu.input, state.userId);
      state.toolResults.push({
        type: "tool_result",
        tool_use_id: tu.id,
        content: result,
      });
      state.pendingToolUses.shift();
    }

    if (state.toolResults.length === 0) {
      const lastMsg = state.messages[state.messages.length - 1];
      const text =
        lastMsg?.role === "assistant"
          ? extractAssistantText(lastMsg.content) ?? ""
          : "";
      return { kind: "reply", text };
    }

    state.messages.push({ role: "user", content: state.toolResults });
    state.toolResults = [];

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT,
      tools: toolDefinitions,
      messages: state.messages,
    });
    state.messages.push({ role: "assistant", content: response.content });
    state.pendingToolUses = response.content
      .filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use")
      .map((b) => ({
        id: b.id,
        name: b.name,
        input: b.input as Record<string, unknown>,
      }));
  }
}

async function saveChat(
  userId: string,
  userText: string,
  replyText: string
): Promise<void> {
  const supabase = getAdminClient();
  await supabase.from("chat_messages").insert([
    { user_id: userId, role: "user", content: { text: userText } },
    {
      user_id: userId,
      role: "assistant",
      content: { text: replyText },
    },
  ]);
}

export async function POST(request: Request) {
  try {
    const authClient = await createServerClient();
    const {
      data: { user },
    } = await authClient.auth.getUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = user.id;

    const body = await request.json();

    let state: ChatState;

    if (body.state) {
      const incoming = verifyState<ChatState>(body.state, userId);
      if (!incoming) {
        return Response.json(
          { error: "Invalid or expired state" },
          { status: 400 }
        );
      }
      incoming.userId = userId;
      const approved = body.approval?.approved === true;
      const tu = incoming.pendingToolUses[0];
      if (!tu) {
        return Response.json(
          { error: "No pending tool to confirm" },
          { status: 400 }
        );
      }
      if (approved) {
        const result = await executeTool(tu.name, tu.input, userId);
        incoming.toolResults.push({
          type: "tool_result",
          tool_use_id: tu.id,
          content: result,
        });
      } else {
        incoming.toolResults.push({
          type: "tool_result",
          tool_use_id: tu.id,
          content: JSON.stringify({
            error:
              "Usuario canceló la operación. No se aplicó ningún cambio.",
          }),
          is_error: true,
        });
      }
      incoming.pendingToolUses.shift();
      state = incoming;
    } else {
      const messages = body.messages as Array<{
        role: "user" | "assistant";
        content: string;
      }>;
      const userContext = await getUserContext(userId);

      const anthropicMessages: Anthropic.MessageParam[] = messages.map(
        (m) => ({ role: m.role, content: m.content })
      );
      if (
        anthropicMessages.length > 0 &&
        anthropicMessages[0].role === "user"
      ) {
        anthropicMessages[0] = {
          role: "user",
          content: `${userContext}\n\n---\n\nMensaje del usuario: ${anthropicMessages[0].content}`,
        };
      }

      const response = await anthropic.messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: SYSTEM_PROMPT,
        tools: toolDefinitions,
        messages: anthropicMessages,
      });
      anthropicMessages.push({ role: "assistant", content: response.content });

      state = {
        messages: anthropicMessages,
        pendingToolUses: response.content
          .filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use")
          .map((b) => ({
            id: b.id,
            name: b.name,
            input: b.input as Record<string, unknown>,
          })),
        toolResults: [],
        userId,
        lastUserText: messages[messages.length - 1]?.content ?? "",
      };
    }

    const result = await runLoop(state);

    if (result.kind === "needs_confirmation") {
      return Response.json({
        pendingConfirmation: result.pendingConfirmation,
        state: signState(result.state, userId),
      });
    }

    await saveChat(state.userId, state.lastUserText, result.text);
    return Response.json({ reply: result.text });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Chat API error:", message);
    return Response.json({ error: `Error: ${message}` }, { status: 500 });
  }
}
