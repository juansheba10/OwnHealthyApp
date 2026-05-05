interface MacrosBarProps {
  kcal: number;
  protein: number;
  targetKcal?: number;
  targetProtein?: number;
}

export function MacrosBar({
  kcal,
  protein,
  targetKcal,
  targetProtein,
}: MacrosBarProps) {
  const kcalPct = targetKcal ? Math.min((kcal / targetKcal) * 100, 100) : 0;
  const proteinPct = targetProtein
    ? Math.min((protein / targetProtein) * 100, 100)
    : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted">Calorías</span>
        <span className="font-mono text-text">
          {kcal}
          {targetKcal && <span className="text-muted"> / {targetKcal}</span>}
          <span className="text-muted"> kcal</span>
        </span>
      </div>
      {targetKcal && (
        <div className="h-1.5 rounded-full bg-border overflow-hidden">
          <div
            className="h-full rounded-full bg-accent transition-all"
            style={{ width: `${kcalPct}%` }}
          />
        </div>
      )}
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted">Proteína</span>
        <span className="font-mono text-text">
          {protein}
          {targetProtein && (
            <span className="text-muted"> / {targetProtein}</span>
          )}
          <span className="text-muted"> g</span>
        </span>
      </div>
      {targetProtein && (
        <div className="h-1.5 rounded-full bg-border overflow-hidden">
          <div
            className="h-full rounded-full bg-accent2 transition-all"
            style={{ width: `${proteinPct}%` }}
          />
        </div>
      )}
    </div>
  );
}
