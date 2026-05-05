"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { MealItem } from "@/lib/types";
import { MealBlock } from "./MealBlock";
import { MacrosBar } from "./MacrosBar";
import Link from "next/link";

interface DayCardProps {
  date: string;
  dayType: string;
  meals: MealItem[];
  totalKcal: number;
  totalProtein: number;
  targetKcal?: number;
  targetProtein?: number;
}

const DAY_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  training: { label: "Entreno", color: "text-accent" },
  rest: { label: "Descanso", color: "text-blue" },
  double: { label: "Doble sesión", color: "text-purple" },
  football_only: { label: "Fútbol", color: "text-accent2" },
};

export function DayCard({
  date,
  dayType,
  meals,
  totalKcal,
  totalProtein,
  targetKcal,
  targetProtein,
}: DayCardProps) {
  const [expanded, setExpanded] = useState(false);
  const dayInfo = DAY_TYPE_LABELS[dayType] ?? DAY_TYPE_LABELS.training;
  const dateObj = new Date(date + "T12:00:00");
  const dayName = format(dateObj, "EEEE", { locale: es });
  const dayNumber = format(dateObj, "d MMM", { locale: es });

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:border-accent transition-colors"
      >
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium capitalize">{dayName}</span>
            <span className="text-xs text-muted">{dayNumber}</span>
            <span className={`text-xs ${dayInfo.color}`}>{dayInfo.label}</span>
          </div>
          <div className="flex gap-3 mt-1 text-xs font-mono text-muted">
            <span>{totalKcal} kcal</span>
            <span>{totalProtein}g prot</span>
          </div>
        </div>
        <ChevronDown
          size={16}
          className={`text-muted transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-border">
          <div className="mt-3 space-y-1 divide-y divide-border/50">
            {meals.map((meal, i) => (
              <MealBlock key={i} meal={meal} />
            ))}
          </div>

          <div className="mt-4">
            <MacrosBar
              kcal={totalKcal}
              protein={totalProtein}
              targetKcal={targetKcal}
              targetProtein={targetProtein}
            />
          </div>

          <Link
            href={`/plan/${date}`}
            className="mt-3 block text-center text-xs text-accent hover:underline"
          >
            Editar día
          </Link>
        </div>
      )}
    </div>
  );
}
