import type { SupabaseClient } from "@supabase/supabase-js";
import {
  HYROX_DAY_ORDER,
  getSessionForDate as getSessionForDateInWeeks,
  type HyroxDayCode,
  type HyroxPhaseId,
  type HyroxSession,
  type HyroxSessionType,
  type HyroxWeek,
} from "@/lib/hyrox/plan";

export interface HyroxRace {
  id: string;
  name: string;
  venue: string | null;
  raceDate: string;
  planStart: string;
}

// A user's race: prefers the soonest upcoming one, falls back to the most
// recent past one (e.g. right after race day), null if none configured yet.
export async function getRaceForUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<HyroxRace | null> {
  const today = new Date().toISOString().split("T")[0];

  const { data: upcoming } = await supabase
    .from("hyrox_races")
    .select("id, name, venue, race_date, plan_start")
    .eq("user_id", userId)
    .gte("race_date", today)
    .order("race_date", { ascending: true })
    .limit(1)
    .maybeSingle();

  let row = upcoming;
  if (!row) {
    const { data: past } = await supabase
      .from("hyrox_races")
      .select("id, name, venue, race_date, plan_start")
      .eq("user_id", userId)
      .order("race_date", { ascending: false })
      .limit(1)
      .maybeSingle();
    row = past;
  }

  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    venue: row.venue,
    raceDate: row.race_date,
    planStart: row.plan_start,
  };
}

export async function getWeeksForRace(
  supabase: SupabaseClient,
  raceId: string,
): Promise<HyroxWeek[]> {
  const { data: weeks, error } = await supabase
    .from("hyrox_weeks")
    .select(
      "week_num, phase, start_date, date_label, load, focus, descarga, sim, race_day, hyrox_sessions(day_code, session_type, description)",
    )
    .eq("race_id", raceId)
    .order("week_num", { ascending: true });

  if (error || !weeks) return [];

  const dayRank = new Map(HYROX_DAY_ORDER.map((d, i) => [d, i]));

  return weeks.map((w) => ({
    w: w.week_num,
    phase: w.phase as HyroxPhaseId,
    startDate: w.start_date,
    dateLabel: w.date_label,
    load: w.load,
    focus: w.focus,
    descarga: w.descarga,
    sim: w.sim,
    raceDay: w.race_day,
    sessions: (
      (w.hyrox_sessions ?? []) as {
        day_code: string;
        session_type: string;
        description: string;
      }[]
    )
      .map((s) => ({
        day: s.day_code as HyroxDayCode,
        type: s.session_type as HyroxSessionType,
        desc: s.description,
      }))
      .sort(
        (a, b) => (dayRank.get(a.day) ?? 0) - (dayRank.get(b.day) ?? 0),
      ) as HyroxSession[],
  }));
}

export async function getSessionForDateForUser(
  supabase: SupabaseClient,
  userId: string,
  date: Date,
): Promise<{ race: HyroxRace; week: HyroxWeek; session: HyroxSession } | null> {
  const race = await getRaceForUser(supabase, userId);
  if (!race) return null;
  const weeks = await getWeeksForRace(supabase, race.id);
  const result = getSessionForDateInWeeks(
    weeks,
    race.planStart,
    race.raceDate,
    date,
  );
  if (!result) return null;
  return { race, ...result };
}
