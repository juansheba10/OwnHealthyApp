import webpush from "web-push";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getAdminClient } from "@/lib/supabase/admin";
import { getSessionForDateForUser } from "@/lib/hyrox/data";

// Triggered every 5 minutes by a Supabase pg_cron job — see
// supabase/CRON_SETUP.md. Checks three things and sends a Web Push
// notification (deduped via reminder_log) for each that's due:
// fasting end, today's Hyrox session, and meal times.

const TIMEZONE = "Atlantic/Canary";
const HYROX_REMINDER_HOUR = 7;
const MEAL_WINDOW_MIN = 5;

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT ?? "",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "",
  process.env.VAPID_PRIVATE_KEY ?? "",
);

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, "");
}

interface CanaryNow {
  hour: number;
  minute: number;
  dateIso: string;
}

function getCanaryNow(now: Date): CanaryNow {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const parts = fmt.formatToParts(now);
  const get = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? "00";
  return {
    hour: Number(get("hour")),
    minute: Number(get("minute")),
    dateIso: `${get("year")}-${get("month")}-${get("day")}`,
  };
}

// Atomically claims a (user, kind, ref) reminder slot via the reminder_log
// primary key — returns false if it was already sent (or on any DB error).
async function claimReminder(
  supabase: SupabaseClient,
  userId: string,
  kind: "fasting_end" | "hyrox_session" | "meal_time",
  refId: string,
): Promise<boolean> {
  const { error } = await supabase
    .from("reminder_log")
    .insert({ user_id: userId, kind, ref_id: refId });
  if (error) {
    if (error.code !== "23505") {
      console.error(`claimReminder(${kind}, ${refId}) failed:`, error);
    }
    return false;
  }
  return true;
}

interface PushPayload {
  title: string;
  body: string;
  url: string;
}

async function sendPushToUser(
  supabase: SupabaseClient,
  userId: string,
  payload: PushPayload,
): Promise<void> {
  const { data: subs } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", userId);

  for (const sub of subs ?? []) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify(payload),
      );
    } catch (err) {
      const statusCode = (err as { statusCode?: number }).statusCode;
      if (statusCode === 404 || statusCode === 410) {
        await supabase.from("push_subscriptions").delete().eq("id", sub.id);
      } else {
        console.error("Push send failed:", err);
      }
    }
  }
}

async function checkFastingEnd(
  supabase: SupabaseClient,
  now: Date,
): Promise<number> {
  const { data: dueFasts } = await supabase
    .from("fasting_sessions")
    .select("id, user_id")
    .is("ended_at", null)
    .lte("target_end_at", now.toISOString());

  let sent = 0;
  for (const fast of dueFasts ?? []) {
    const claimed = await claimReminder(
      supabase,
      fast.user_id,
      "fasting_end",
      fast.id,
    );
    if (!claimed) continue;
    await sendPushToUser(supabase, fast.user_id, {
      title: "Ayuno terminado",
      body: "Tu ventana de ayuno ha terminado.",
      url: "/",
    });
    await supabase
      .from("fasting_sessions")
      .update({ end_notified_at: now.toISOString() })
      .eq("id", fast.id);
    sent++;
  }
  return sent;
}

async function checkHyroxSessions(
  supabase: SupabaseClient,
  now: Date,
  canary: CanaryNow,
): Promise<number> {
  if (canary.hour < HYROX_REMINDER_HOUR) return 0;

  const { data: raceRows } = await supabase
    .from("hyrox_races")
    .select("user_id");
  const userIds = [...new Set((raceRows ?? []).map((r) => r.user_id))];

  let sent = 0;
  for (const userId of userIds) {
    const info = await getSessionForDateForUser(supabase, userId, now);
    if (!info || info.session.type === "rest") continue;

    const claimed = await claimReminder(
      supabase,
      userId,
      "hyrox_session",
      canary.dateIso,
    );
    if (!claimed) continue;

    await sendPushToUser(supabase, userId, {
      title: `Sesión Hyrox de hoy · S${info.week.w}`,
      body: stripHtml(info.session.desc),
      url: "/hyrox",
    });
    sent++;
  }
  return sent;
}

async function checkMealTimes(
  supabase: SupabaseClient,
  canary: CanaryNow,
): Promise<number> {
  const { data: mealPlans } = await supabase
    .from("meal_plans")
    .select("user_id, date, meals")
    .eq("date", canary.dateIso);

  const nowMinutes = canary.hour * 60 + canary.minute;
  let sent = 0;

  for (const plan of mealPlans ?? []) {
    const meals = (plan.meals ?? []) as {
      time: string;
      label: string;
      name: string;
    }[];

    for (const meal of meals) {
      const [h, m] = meal.time.split(":").map(Number);
      if (!Number.isFinite(h) || !Number.isFinite(m)) continue;
      const mealMinutes = h * 60 + m;
      if (
        nowMinutes < mealMinutes ||
        nowMinutes >= mealMinutes + MEAL_WINDOW_MIN
      ) {
        continue;
      }

      const refId = `${plan.date}-${meal.time}`;
      const claimed = await claimReminder(
        supabase,
        plan.user_id,
        "meal_time",
        refId,
      );
      if (!claimed) continue;

      await sendPushToUser(supabase, plan.user_id, {
        title: `Hora de: ${meal.label}`,
        body: meal.name,
        url: "/",
      });
      sent++;
    }
  }
  return sent;
}

export async function POST(request: Request) {
  const secret = request.headers.get("x-cron-secret");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getAdminClient();
  const now = new Date();
  const canary = getCanaryNow(now);

  const [fastingSent, hyroxSent, mealSent] = await Promise.all([
    checkFastingEnd(supabase, now),
    checkHyroxSessions(supabase, now, canary),
    checkMealTimes(supabase, canary),
  ]);

  return Response.json({
    ok: true,
    sent: { fastingSent, hyroxSent, mealSent },
  });
}
