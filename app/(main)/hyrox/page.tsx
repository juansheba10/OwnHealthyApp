import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  HYROX_WEEKS,
  HYROX_RACE_VENUE,
  getWeekForDate,
  daysUntilRace,
} from "@/lib/hyrox/plan";
import { HyroxPlanView } from "./HyroxPlanView";

export const metadata = {
  title: "Plan Hyrox · NutriTrack",
};

export default async function HyroxPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const today = new Date();
  const currentWeek = getWeekForDate(today);
  const days = daysUntilRace(today);

  return (
    <HyroxPlanView
      weeks={HYROX_WEEKS}
      currentWeekNum={currentWeek?.w ?? null}
      raceVenue={HYROX_RACE_VENUE}
      daysUntilRace={days}
    />
  );
}
