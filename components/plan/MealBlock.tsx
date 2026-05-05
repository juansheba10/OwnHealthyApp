import type { MealItem } from "@/lib/types";

interface MealBlockProps {
  meal: MealItem;
}

export function MealBlock({ meal }: MealBlockProps) {
  return (
    <div className="flex items-start gap-3 py-2">
      <span className="font-mono text-xs text-muted shrink-0 pt-0.5">
        {meal.time}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-text truncate">{meal.name}</p>
        <p className="text-xs text-muted">{meal.label}</p>
      </div>
      <span className="font-mono text-xs text-muted shrink-0">
        {meal.kcal} kcal
      </span>
    </div>
  );
}
