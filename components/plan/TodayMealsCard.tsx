"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import Link from "next/link";
import type { MealItem } from "@/lib/types";
import { logPlannedMeal, unlogPlannedMeal } from "@/lib/actions/meal-logs";

interface Props {
  planId: string | null;
  meals: MealItem[];
  totalKcal: number;
  targetKcal?: number;
  initialLoggedByTime: Record<string, string>;
}

const PENDING = "__pending__";

export function TodayMealsCard({
  planId,
  meals,
  totalKcal,
  targetKcal,
  initialLoggedByTime,
}: Props) {
  const [logged, setLogged] = useState(initialLoggedByTime);
  const [pending, setPending] = useState<Record<string, boolean>>({});

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const nextMealIndex = meals.findIndex((m) => {
    const [h, min] = m.time.split(":").map(Number);
    return h * 60 + min > currentMinutes;
  });

  const loggedKcal = meals.reduce(
    (sum, m) => sum + (logged[m.time] ? m.kcal : 0),
    0,
  );

  async function handleToggle(meal: MealItem) {
    if (!planId) return;
    if (pending[meal.time]) return;
    const prevId = logged[meal.time];

    setPending((p) => ({ ...p, [meal.time]: true }));

    try {
      if (prevId && prevId !== PENDING) {
        setLogged((l) => {
          const next = { ...l };
          delete next[meal.time];
          return next;
        });
        await unlogPlannedMeal(prevId);
      } else if (!prevId) {
        setLogged((l) => ({ ...l, [meal.time]: PENDING }));
        const { id } = await logPlannedMeal(planId, meal.time, meal);
        setLogged((l) => ({ ...l, [meal.time]: id }));
      }
    } catch (err) {
      console.error(err);
      setLogged((l) => {
        const next = { ...l };
        if (prevId) next[meal.time] = prevId;
        else delete next[meal.time];
        return next;
      });
    } finally {
      setPending((p) => ({ ...p, [meal.time]: false }));
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs text-muted uppercase tracking-wider">
          Comidas de hoy
          {planId && (
            <span className="ml-2 text-accent">
              {loggedKcal} / {totalKcal} kcal
              {targetKcal && ` · meta ${targetKcal}`}
            </span>
          )}
        </h3>
        <Link href="/plan" className="text-xs text-accent hover:underline">
          Ver plan
        </Link>
      </div>
      {meals.length > 0 && planId ? (
        <div className="space-y-2">
          {meals.map((meal, i) => {
            const isLogged = !!logged[meal.time];
            const isPending = !!pending[meal.time];
            return (
              <div
                key={i}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 ${
                  isLogged
                    ? "bg-accent2/10 border border-accent2/20"
                    : i === nextMealIndex
                      ? "bg-accent/10 border border-accent/20"
                      : "bg-surface"
                }`}
              >
                <span className="font-mono text-xs text-muted w-12">
                  {meal.time}
                </span>
                <span
                  className={`text-sm flex-1 truncate ${
                    isLogged ? "text-muted line-through" : "text-text"
                  }`}
                >
                  {meal.name}
                </span>
                <span className="font-mono text-xs text-muted">
                  {meal.kcal}
                </span>
                <button
                  onClick={() => handleToggle(meal)}
                  disabled={isPending}
                  aria-label={
                    isLogged ? "Desmarcar comida" : "Marcar como comida"
                  }
                  className={`flex h-7 w-7 items-center justify-center rounded-full border transition-colors disabled:opacity-50 ${
                    isLogged
                      ? "bg-accent2 border-accent2 text-bg"
                      : "border-border text-muted hover:border-accent hover:text-accent"
                  }`}
                >
                  <Check size={14} className={isLogged ? "" : "opacity-0"} />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted">No hay plan para hoy</p>
      )}
    </div>
  );
}
