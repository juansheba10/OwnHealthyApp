import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Scale, Dumbbell, MessageCircle } from "lucide-react";
import type { MealItem, CalorieTargets } from "@/lib/types";
import { FastingTimer } from "@/components/fasting/FastingTimer";
import { TodayMealsCard } from "@/components/plan/TodayMealsCard";
import type { FastingSession } from "@/app/(main)/fasting/actions";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const today = new Date().toISOString().split("T")[0];
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoStr = weekAgo.toISOString().split("T")[0];

  const [
    profileResult,
    todayPlanResult,
    weightResult,
    workoutResult,
    activeFastResult,
    todayLogsResult,
  ] = await Promise.all([
    supabase
      .from("users")
      .select("name, calorie_targets, protein_target, fasting_protocol")
      .eq("id", user.id)
      .single(),
    supabase
      .from("meal_plans")
      .select("id, meals, day_type, total_kcal, total_protein")
      .eq("user_id", user.id)
      .eq("date", today)
      .single(),
    supabase
      .from("weight_logs")
      .select("date, weight_kg")
      .eq("user_id", user.id)
      .gte("date", weekAgoStr)
      .order("date", { ascending: false }),
    supabase
      .from("workout_logs")
      .select("date, type, duration_min")
      .eq("user_id", user.id)
      .gte("date", weekAgo.toISOString())
      .order("date", { ascending: false }),
    supabase
      .from("fasting_sessions")
      .select("*")
      .eq("user_id", user.id)
      .is("ended_at", null)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("meal_logs")
      .select("id, meal_time")
      .eq("user_id", user.id)
      .eq("date", today),
  ]);

  const profile = profileResult.data;
  const todayPlan = todayPlanResult.data;
  const weights = weightResult.data ?? [];
  const workouts = workoutResult.data ?? [];
  const activeFast = (activeFastResult.data as FastingSession | null) ?? null;
  const fastingProtocol = (profile?.fasting_protocol as string | null) ?? null;
  const todayLogs = (todayLogsResult.data ?? []) as {
    id: string;
    meal_time: string;
  }[];
  const loggedByTime = todayLogs.reduce<Record<string, string>>((acc, log) => {
    acc[log.meal_time.slice(0, 5)] = log.id;
    return acc;
  }, {});

  const dayName = new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  // Today's meals
  const meals = (todayPlan?.meals ?? []) as MealItem[];

  // Weight
  const lastWeight = weights[0] ? Number(weights[0].weight_kg) : null;
  const weightTrend =
    weights.length >= 2
      ? Number(weights[0].weight_kg) -
        Number(weights[weights.length - 1].weight_kg)
      : null;

  // Calorie target for today
  const calorieTargets = profile?.calorie_targets as CalorieTargets | undefined;
  const targetKcal = calorieTargets && todayPlan
    ? calorieTargets[todayPlan.day_type as keyof CalorieTargets]
    : undefined;

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="font-display text-4xl uppercase tracking-wide">
          Hola, {profile?.name ?? "usuario"}
        </h1>
        <p className="text-muted mt-1 capitalize">{dayName}</p>
      </div>

      {/* Today's meals */}
      <TodayMealsCard
        planId={(todayPlan?.id as string | undefined) ?? null}
        meals={meals}
        totalKcal={todayPlan?.total_kcal ?? 0}
        targetKcal={targetKcal}
        initialLoggedByTime={loggedByTime}
      />

      {/* Fasting timer */}
      {(fastingProtocol || activeFast) && (
        <FastingTimer
          initialSession={activeFast}
          protocol={fastingProtocol}
        />
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        {/* Weight */}
        <Link
          href="/track/weight"
          className="rounded-xl border border-border bg-card p-4 hover:border-accent/50 transition-colors"
        >
          <div className="flex items-center gap-2 mb-2">
            <Scale size={14} className="text-accent2" />
            <h3 className="text-xs text-muted">Último peso</h3>
          </div>
          {lastWeight ? (
            <div>
              <span className="font-mono text-xl text-text">
                {lastWeight.toFixed(1)}
              </span>
              <span className="text-xs text-muted"> kg</span>
              {weightTrend !== null && (
                <p
                  className={`text-xs mt-1 ${weightTrend <= 0 ? "text-accent2" : "text-pink"}`}
                >
                  {weightTrend > 0 ? "+" : ""}
                  {weightTrend.toFixed(1)} kg esta semana
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted">Sin registros</p>
          )}
        </Link>

        {/* Workouts */}
        <Link
          href="/track/workouts"
          className="rounded-xl border border-border bg-card p-4 hover:border-accent/50 transition-colors"
        >
          <div className="flex items-center gap-2 mb-2">
            <Dumbbell size={14} className="text-accent" />
            <h3 className="text-xs text-muted">Entrenos 7d</h3>
          </div>
          {workouts.length > 0 ? (
            <div>
              <span className="font-mono text-xl text-text">
                {workouts.length}
              </span>
              <span className="text-xs text-muted"> sesiones</span>
              <p className="text-xs text-muted mt-1">
                {workouts.reduce((s, w) => s + w.duration_min, 0)} min total
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted">Sin entrenos</p>
          )}
        </Link>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-2">
        <Link
          href="/track/weight"
          className="rounded-xl border border-border bg-card p-3 text-center hover:border-accent/50 transition-colors"
        >
          <Scale size={18} className="mx-auto text-accent2" />
          <span className="text-xs text-muted mt-1 block">Añadir peso</span>
        </Link>
        <Link
          href="/track/workouts"
          className="rounded-xl border border-border bg-card p-3 text-center hover:border-accent/50 transition-colors"
        >
          <Dumbbell size={18} className="mx-auto text-accent" />
          <span className="text-xs text-muted mt-1 block">Log entreno</span>
        </Link>
        <Link
          href="/chat"
          className="rounded-xl border border-border bg-card p-3 text-center hover:border-accent/50 transition-colors"
        >
          <MessageCircle size={18} className="mx-auto text-pink" />
          <span className="text-xs text-muted mt-1 block">Chat IA</span>
        </Link>
      </div>
    </div>
  );
}
