import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getWeekForDate, daysUntilRace } from "@/lib/hyrox/plan";
import { getRaceForUser, getWeeksForRace } from "@/lib/hyrox/data";
import type { HyroxSessionStatus } from "./actions";
import {
  HyroxPlanView,
  type SessionStatusMap,
  type SessionReplacementMap,
} from "./HyroxPlanView";
import { NewRaceForm } from "@/components/hyrox/NewRaceForm";
import { AddRaceSection } from "@/components/hyrox/AddRaceSection";

export const metadata = {
  title: "Plan Hyrox · OwnHealthyApp",
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

  const race = await getRaceForUser(supabase, user.id);

  if (!race) {
    return (
      <div className="mx-auto flex max-w-sm flex-col gap-4 py-8">
        <div className="text-center text-muted">
          <h1 className="font-display text-2xl uppercase tracking-wide text-text">
            Sin plan Hyrox
          </h1>
          <p className="text-sm">
            Todavía no hay ninguna carrera configurada para tu cuenta.
          </p>
        </div>
        <NewRaceForm />
      </div>
    );
  }

  const weeks = await getWeeksForRace(supabase, race.id);

  const today = new Date();
  const currentWeek = getWeekForDate(
    weeks,
    race.planStart,
    race.raceDate,
    today,
  );
  const days = daysUntilRace(race.raceDate, today);

  const { data: logs } = await supabase
    .from("workout_logs")
    .select("notes, date, type, duration_min")
    .eq("user_id", user.id)
    .gte("date", `${race.planStart}T00:00:00Z`)
    .lte("date", `${race.raceDate}T23:59:59Z`)
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
    <div className="space-y-6">
      <HyroxPlanView
        weeks={weeks}
        currentWeekNum={currentWeek?.w ?? null}
        raceVenue={race.venue ?? ""}
        daysUntilRace={days}
        statusMap={statusMap}
        replacementMap={replacementMap}
      />
      <AddRaceSection />
    </div>
  );
}
