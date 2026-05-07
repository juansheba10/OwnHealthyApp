"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { eachDayOfInterval, format } from "date-fns";
import { es } from "date-fns/locale";
import { DayCard } from "@/components/plan/DayCard";
import { getWeekRange } from "@/lib/utils/dates";
import { deleteDayPlan, getMealPlans } from "./actions";
import type { MealItem, CalorieTargets } from "@/lib/types";

interface MealPlan {
  id: string;
  date: string;
  day_type: string;
  meals: MealItem[];
  total_kcal: number;
  total_protein: number;
}

export default function PlanPage() {
  const router = useRouter();
  const [weekOffset, setWeekOffset] = useState(0);
  const [plans, setPlans] = useState<MealPlan[]>([]);
  const [targets, setTargets] = useState<{
    calorie_targets: CalorieTargets;
    protein_target: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const lastFetched = useRef("");

  const week = getWeekRange(weekOffset);

  const weekDates = useMemo(
    () =>
      eachDayOfInterval({
        start: new Date(week.start + "T12:00:00"),
        end: new Date(week.end + "T12:00:00"),
      }).map((d) => format(d, "yyyy-MM-dd")),
    [week.start, week.end]
  );

  const plansByDate = useMemo(() => {
    const map = new Map<string, MealPlan>();
    for (const p of plans) map.set(p.date, p);
    return map;
  }, [plans]);

  async function handleDeleteDay(planId: string) {
    await deleteDayPlan(planId);
    setPlans((prev) => prev.filter((p) => p.id !== planId));
  }

  useEffect(() => {
    const key = `${week.start}-${week.end}`;
    if (lastFetched.current === key) return;
    lastFetched.current = key;

    setLoading(true);
    getMealPlans(week.start, week.end).then(({ plans: p, profile }) => {
      setPlans(p as MealPlan[]);
      setTargets(profile as typeof targets);
      setLoading(false);
    });
  }, [week.start, week.end]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl uppercase tracking-wide">
          Plan de comidas
        </h1>
      </div>

      {/* Week selector */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setWeekOffset((w) => w - 1)}
          className="p-2 rounded-lg hover:bg-card transition-colors"
        >
          <ChevronLeft size={20} className="text-muted" />
        </button>
        <span className="text-sm text-text">{week.label}</span>
        <button
          onClick={() => setWeekOffset((w) => w + 1)}
          className="p-2 rounded-lg hover:bg-card transition-colors"
        >
          <ChevronRight size={20} className="text-muted" />
        </button>
      </div>

      {/* Day cards */}
      {loading ? (
        <div className="text-center text-muted py-8">Cargando plan...</div>
      ) : (
        <>
          {plans.length === 0 && (
            <div className="rounded-xl border border-border bg-card p-4 text-center space-y-3">
              <div>
                <p className="text-sm text-text">No hay plan para esta semana</p>
                <p className="text-xs text-muted mt-1">
                  Programa antes tus entrenos para que la IA ajuste el plan a tu
                  carga.
                </p>
              </div>
              <button
                onClick={() => {
                  const prompt = `Genera el plan de comidas para la semana del ${week.start} al ${week.end}.`;
                  router.push(`/chat?prefill=${encodeURIComponent(prompt)}`);
                }}
                className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-bg"
              >
                <Sparkles size={14} />
                Generar plan completo
              </button>
            </div>
          )}

          <div className="space-y-3">
            {weekDates.map((date) => {
              const plan = plansByDate.get(date);
              if (!plan) {
                return (
                  <EmptyDayCard
                    key={date}
                    date={date}
                    onGenerate={() => {
                      const dayName = format(
                        new Date(date + "T12:00:00"),
                        "EEEE d 'de' MMMM",
                        { locale: es }
                      );
                      const prompt = `Genera el plan de comidas para el ${dayName} (${date}).`;
                      router.push(
                        `/chat?prefill=${encodeURIComponent(prompt)}`
                      );
                    }}
                  />
                );
              }

              const calorieTargets = targets?.calorie_targets as
                | CalorieTargets
                | undefined;
              const targetKcal = calorieTargets
                ? calorieTargets[plan.day_type as keyof CalorieTargets]
                : undefined;

              return (
                <DayCard
                  key={plan.id}
                  date={plan.date}
                  dayType={plan.day_type}
                  meals={plan.meals}
                  totalKcal={plan.total_kcal}
                  totalProtein={plan.total_protein}
                  targetKcal={targetKcal}
                  targetProtein={targets?.protein_target}
                  onDelete={() => handleDeleteDay(plan.id)}
                />
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function EmptyDayCard({
  date,
  onGenerate,
}: {
  date: string;
  onGenerate: () => void;
}) {
  const dateObj = new Date(date + "T12:00:00");
  const dayName = format(dateObj, "EEEE", { locale: es });
  const dayNumber = format(dateObj, "d MMM", { locale: es });

  return (
    <div className="rounded-xl border border-dashed border-border bg-card/40 px-4 py-3 flex items-center gap-3">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium capitalize text-muted">
            {dayName}
          </span>
          <span className="text-xs text-muted">{dayNumber}</span>
        </div>
        <p className="text-xs text-muted mt-1">Sin plan</p>
      </div>
      <button
        onClick={onGenerate}
        className="inline-flex items-center gap-1.5 rounded-lg border border-accent/40 bg-accent/10 text-accent px-3 py-1.5 text-xs font-medium hover:bg-accent/20"
      >
        <Sparkles size={12} />
        Generar con IA
      </button>
    </div>
  );
}
