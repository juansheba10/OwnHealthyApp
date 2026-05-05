"use client";

import { useEffect, useState, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayCard } from "@/components/plan/DayCard";
import { getWeekRange } from "@/lib/utils/dates";
import { getMealPlans } from "./actions";
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
  const [weekOffset, setWeekOffset] = useState(0);
  const [plans, setPlans] = useState<MealPlan[]>([]);
  const [targets, setTargets] = useState<{
    calorie_targets: CalorieTargets;
    protein_target: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const lastFetched = useRef("");

  const week = getWeekRange(weekOffset);

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
      ) : plans.length === 0 ? (
        <div className="text-center text-muted py-8">
          No hay plan para esta semana
        </div>
      ) : (
        <div className="space-y-3">
          {plans.map((plan) => {
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
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
