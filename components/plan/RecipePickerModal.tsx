"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, X, Flame, Clock } from "lucide-react";
import { getRecipes } from "@/app/(main)/recipes/actions";
import type { Macros } from "@/lib/types";

interface Recipe {
  id: string;
  title: string;
  subtitle: string;
  tags: string[];
  macros: Macros;
  prep_time_min: number | null;
}

const MEAL_LABELS = [
  "Desayuno",
  "Romper ayuno",
  "Pre-entreno",
  "Comida",
  "Post-entreno",
  "Snack",
  "Cena",
];

type Section = "main" | "light" | "quick" | "snack" | "side";

const SECTION_LABELS: Record<Section, string> = {
  main: "Platos principales",
  light: "Ligeras",
  quick: "Rápidas",
  snack: "Snacks",
  side: "Acompañamientos",
};

const SECTION_ORDER: Section[] = ["main", "light", "quick", "snack", "side"];

function categorize(tags: string[]): Section {
  if (tags.includes("snack")) return "snack";
  if (tags.includes("side")) return "side";
  if (tags.includes("light")) return "light";
  if (tags.includes("quick")) return "quick";
  return "main";
}

interface Props {
  defaultTime: string;
  defaultLabel?: string;
  onPick: (recipeId: string, time: string, label: string) => Promise<void>;
  onClose: () => void;
}

export function RecipePickerModal({
  defaultTime,
  defaultLabel,
  onPick,
  onClose,
}: Props) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [time, setTime] = useState(defaultTime);
  const [label, setLabel] = useState(defaultLabel ?? "Comida");
  const [submitting, setSubmitting] = useState<string | null>(null);

  useEffect(() => {
    getRecipes().then((data) => {
      setRecipes(data as Recipe[]);
      setLoading(false);
    });
  }, []);

  const grouped = useMemo(() => {
    const filtered = recipes.filter((r) =>
      !search ? true : r.title.toLowerCase().includes(search.toLowerCase())
    );
    const buckets: Record<Section, Recipe[]> = {
      main: [],
      light: [],
      quick: [],
      snack: [],
      side: [],
    };
    for (const r of filtered) {
      buckets[categorize(r.tags)].push(r);
    }
    return buckets;
  }, [recipes, search]);

  async function handlePick(recipeId: string) {
    if (!label.trim()) return;
    setSubmitting(recipeId);
    try {
      await onPick(recipeId, time, label.trim());
      onClose();
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-hidden rounded-xl border border-border bg-surface flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-display text-2xl uppercase tracking-wide">
            Añadir desde receta
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-card text-muted hover:text-text"
          >
            <X size={20} />
          </button>
        </div>

        {/* Time + label */}
        <div className="p-4 border-b border-border space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
            />
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Etiqueta (Comida, Cena…)"
              className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {MEAL_LABELS.map((l) => (
              <button
                key={l}
                onClick={() => setLabel(l)}
                className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                  label === l
                    ? "bg-accent text-bg"
                    : "bg-card text-muted border border-border hover:text-text"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar receta..."
              className="w-full rounded-lg border border-border bg-card pl-9 pr-4 py-2 text-sm text-text placeholder:text-muted focus:border-accent focus:outline-none"
            />
          </div>
        </div>

        {/* Recipe list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {loading && (
            <p className="text-center text-muted py-8 text-sm">
              Cargando recetas...
            </p>
          )}
          {!loading &&
            SECTION_ORDER.map((section) => {
              const items = grouped[section];
              if (items.length === 0) return null;
              return (
                <div key={section} className="space-y-2">
                  <h3 className="text-xs uppercase tracking-wide text-muted font-mono">
                    {SECTION_LABELS[section]}
                  </h3>
                  <ul className="space-y-2">
                    {items.map((r) => (
                      <li key={r.id}>
                        <button
                          onClick={() => handlePick(r.id)}
                          disabled={submitting !== null}
                          className="w-full text-left rounded-xl border border-border bg-card p-3 hover:border-accent/50 transition-colors disabled:opacity-50"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-text truncate">
                                {r.title}
                              </p>
                              {r.subtitle && (
                                <p className="text-xs text-muted truncate mt-0.5">
                                  {r.subtitle}
                                </p>
                              )}
                            </div>
                            <span className="text-xs text-muted font-mono shrink-0">
                              {submitting === r.id ? "…" : "+"}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted">
                            <span className="flex items-center gap-1">
                              <Flame size={12} />
                              {r.macros.kcal} kcal
                            </span>
                            <span className="text-accent2">
                              {r.macros.protein}g prot
                            </span>
                            {r.prep_time_min ? (
                              <span className="flex items-center gap-1">
                                <Clock size={12} />
                                {r.prep_time_min} min
                              </span>
                            ) : null}
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          {!loading &&
            SECTION_ORDER.every((s) => grouped[s].length === 0) && (
              <p className="text-center text-muted py-8 text-sm">
                No hay recetas que coincidan
              </p>
            )}
        </div>
      </div>
    </div>
  );
}
