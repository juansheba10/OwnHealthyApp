import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  HYROX_WEEKS,
  HYROX_RACE_VENUE,
  HYROX_PLAN_START,
  HYROX_RACE_DATE,
  getWeekForDate,
  daysUntilRace,
} from "@/lib/hyrox/plan";
import type { HyroxSessionStatus } from "./actions";
import {
  HyroxPlanView,
  type SessionStatusMap,
  type SessionReplacementMap,
} from "./HyroxPlanView";

export const metadata = {
  title: "Plan Hyrox · NutriTrack",
};

const HYROX_NOTE_RE =
  /^Hyrox S(\d+) · ([^\s\[]+)(\s\[(SALTADA|REEMPLAZADA|REEMPLAZO_PLAN)\])?/;

function parseHyroxNote(
  notes: string | null,
): { weekNum: number; day: string; status: HyroxSessionStatus } | null {
  if (!notes) return null;
  const m = HYROX_NOTE_RE.exec(notes);
  if (!m) return null;
  const tag = m[4];
  const status: HyroxSessionStatus =
    tag === "SALTADA"
      ? "skipped"
      : tag === "REEMPLAZADA"
        ? "replaced"
        : tag === "REEMPLAZO_PLAN"
          ? "replaced_planned"
          : "done";
  return { weekNum: Number(m[1]), day: m[2], status };
}

export default async function HyroxPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const today = new Date();
  const currentWeek = getWeekForDate(today);
  const days = daysUntilRace(today);

  const { data: logs } = await supabase
    .from("workout_logs")
    .select("notes, date, type, duration_min")
    .eq("user_id", user.id)
    .gte("date", `${HYROX_PLAN_START}T00:00:00Z`)
    .lte("date", `${HYROX_RACE_DATE}T23:59:59Z`)
    .like("notes", "Hyrox %");

  const statusMap: SessionStatusMap = {};
  const replacementMap: SessionReplacementMap = {};
  for (const row of logs ?? []) {
    const parsed = parseHyroxNote(row.notes);
    if (!parsed) continue;
    const key = `${parsed.weekNum}-${parsed.day}`;
    statusMap[key] = parsed.status;
    if (parsed.status === "replaced_planned") {
      const userNote =
        /\[REEMPLAZO_PLAN\](?:\s+—\s+(.*))?$/.exec(row.notes ?? "")?.[1] ?? "";
      replacementMap[key] = {
        type: row.type,
        duration_min: row.duration_min,
        notes: userNote.trim(),
      };
    }
  }

  return (
    <HyroxPlanView
      weeks={HYROX_WEEKS}
      currentWeekNum={currentWeek?.w ?? null}
      raceVenue={HYROX_RACE_VENUE}
      daysUntilRace={days}
      statusMap={statusMap}
      replacementMap={replacementMap}
    />
  );
}
