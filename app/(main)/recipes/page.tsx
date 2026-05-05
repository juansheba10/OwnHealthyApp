"use client";

import { useEffect, useState } from "react";
import { Search, Plus, Clock, Flame, X, Users } from "lucide-react";
import { getRecipes, createRecipe, type RecipeInput } from "./actions";
import type { Macros, Ingredient } from "@/lib/types";

interface Recipe {
  id: string;
  title: string;
  subtitle: string;
  tags: string[];
  ingredients: Ingredient[];
  steps: string;
  macros: Macros;
  servings: number;
  prep_time_min: number;
  pairing_notes: string;
}

const ALL_TAGS = [
  "protein",
  "quick",
  "fresh",
  "warm",
  "meal_prep",
  "snack",
  "side",
  "light",
];

const TAG_LABELS: Record<string, string> = {
  protein: "Proteica",
  quick: "Rápida",
  fresh: "Fresca",
  warm: "Caliente",
  meal_prep: "Meal prep",
  snack: "Snack",
  side: "Acompañamiento",
  light: "Ligera",
};

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [search, setSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRecipes().then((data) => {
      setRecipes(data as Recipe[]);
      setLoading(false);
    });
  }, []);

  const filtered = recipes.filter((r) => {
    const matchesSearch =
      !search || r.title.toLowerCase().includes(search.toLowerCase());
    const matchesTags =
      selectedTags.length === 0 ||
      selectedTags.some((tag) => r.tags.includes(tag));
    return matchesSearch && matchesTags;
  });

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  async function handleCreate(recipe: RecipeInput) {
    await createRecipe(recipe);
    const updated = await getRecipes();
    setRecipes(updated as Recipe[]);
    setShowModal(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-4xl uppercase tracking-wide">
          Recetas
        </h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-bg"
        >
          <Plus size={16} />
          Nueva
        </button>
      </div>

      {/* Search */}
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
          className="w-full rounded-lg border border-border bg-surface pl-9 pr-4 py-2.5 text-sm text-text placeholder:text-muted focus:border-accent focus:outline-none"
        />
      </div>

      {/* Tag filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {ALL_TAGS.map((tag) => (
          <button
            key={tag}
            onClick={() => toggleTag(tag)}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              selectedTags.includes(tag)
                ? "bg-accent text-bg"
                : "bg-card text-muted border border-border hover:text-text"
            }`}
          >
            {TAG_LABELS[tag] ?? tag}
          </button>
        ))}
      </div>

      {/* Recipe grid */}
      {loading ? (
        <p className="text-center text-muted py-8">Cargando recetas...</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} onClick={() => setSelectedRecipe(recipe)} />
          ))}
          {filtered.length === 0 && (
            <p className="col-span-full text-center text-muted py-8">
              No hay recetas que coincidan
            </p>
          )}
        </div>
      )}

      {/* Detail modal */}
      {selectedRecipe && (
        <RecipeDetailModal
          recipe={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
        />
      )}

      {/* Create modal */}
      {showModal && (
        <RecipeModal
          onSave={handleCreate}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

function RecipeCard({ recipe, onClick }: { recipe: Recipe; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl border border-border bg-card p-4 hover:border-accent/50 transition-colors text-left w-full"
    >
      <h3 className="text-sm font-medium text-text">{recipe.title}</h3>
      <p className="text-xs text-muted mt-1">{recipe.subtitle}</p>
      <div className="flex items-center gap-3 mt-3 text-xs text-muted">
        <span className="flex items-center gap-1">
          <Flame size={12} />
          {recipe.macros.kcal} kcal
        </span>
        <span className="flex items-center gap-1">
          <span className="text-accent2">P</span>
          {recipe.macros.protein}g
        </span>
        {recipe.prep_time_min && (
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {recipe.prep_time_min} min
          </span>
        )}
      </div>
      <div className="flex gap-1.5 mt-3 flex-wrap">
        {recipe.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-surface px-2 py-0.5 text-[10px] text-muted"
          >
            {TAG_LABELS[tag] ?? tag}
          </span>
        ))}
      </div>
    </button>
  );
}

function RecipeDetailModal({
  recipe,
  onClose,
}: {
  recipe: Recipe;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-xl border border-border bg-surface p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-3xl uppercase tracking-wide">
              {recipe.title}
            </h2>
            <p className="text-sm text-muted mt-1">{recipe.subtitle}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-card text-muted hover:text-text shrink-0">
            <X size={20} />
          </button>
        </div>

        {/* Macros bar */}
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1 text-text">
            <Flame size={14} className="text-warn" />
            {recipe.macros.kcal} kcal
          </span>
          <span className="text-accent2">{recipe.macros.protein}g prot</span>
          <span className="text-muted">{recipe.macros.carbs}g carbs</span>
          <span className="text-muted">{recipe.macros.fat}g fat</span>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-4 text-xs text-muted">
          {recipe.prep_time_min > 0 && (
            <span className="flex items-center gap-1">
              <Clock size={14} />
              {recipe.prep_time_min} min
            </span>
          )}
          <span className="flex items-center gap-1">
            <Users size={14} />
            {recipe.servings} {recipe.servings === 1 ? "ración" : "raciones"}
          </span>
        </div>

        {/* Tags */}
        <div className="flex gap-1.5 flex-wrap">
          {recipe.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-card px-2.5 py-0.5 text-xs text-muted border border-border"
            >
              {TAG_LABELS[tag] ?? tag}
            </span>
          ))}
        </div>

        {/* Ingredients */}
        <div>
          <h3 className="text-sm font-semibold text-text mb-2">Ingredientes</h3>
          <ul className="space-y-1.5">
            {recipe.ingredients.map((ing, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                <span className="text-text">
                  {ing.qty} {ing.unit}
                </span>
                <span className="text-muted">{ing.name}</span>
                {ing.optional && (
                  <span className="text-[10px] text-muted italic">(opcional)</span>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Steps */}
        {recipe.steps && (
          <div>
            <h3 className="text-sm font-semibold text-text mb-2">Preparación</h3>
            <div className="space-y-2">
              {recipe.steps.split(/\d+\.\s*/).filter(Boolean).map((step, i) => (
                <div key={i} className="flex gap-3 text-sm">
                  <span className="font-mono text-xs text-accent shrink-0 pt-0.5 w-5 text-right">
                    {i + 1}.
                  </span>
                  <p className="text-muted">{step.trim()}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pairing notes */}
        {recipe.pairing_notes && (
          <div className="rounded-lg bg-card border border-border p-3">
            <p className="text-xs text-muted">
              <span className="text-accent font-medium">Tip:</span>{" "}
              {recipe.pairing_notes}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function RecipeModal({
  onSave,
  onClose,
}: {
  onSave: (r: RecipeInput) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<RecipeInput>({
    title: "",
    subtitle: "",
    tags: [],
    ingredients: [],
    steps: "",
    macros: { kcal: 0, protein: 0, carbs: 0, fat: 0 },
    servings: 1,
    prep_time_min: 0,
    pairing_notes: "",
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave(form);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 p-4">
      <div className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-xl border border-border bg-surface p-6 space-y-4">
        <h2 className="font-display text-2xl uppercase">Nueva receta</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            placeholder="Título"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
          />
          <input
            type="text"
            placeholder="Subtítulo"
            value={form.subtitle}
            onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
          />
          <div className="flex gap-2 flex-wrap">
            {ALL_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() =>
                  setForm({
                    ...form,
                    tags: form.tags.includes(tag)
                      ? form.tags.filter((t) => t !== tag)
                      : [...form.tags, tag],
                  })
                }
                className={`rounded-full px-2.5 py-1 text-xs ${
                  form.tags.includes(tag)
                    ? "bg-accent text-bg"
                    : "bg-card text-muted border border-border"
                }`}
              >
                {TAG_LABELS[tag] ?? tag}
              </button>
            ))}
          </div>
          <textarea
            placeholder="Pasos (markdown)"
            value={form.steps}
            onChange={(e) => setForm({ ...form, steps: e.target.value })}
            rows={3}
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
          />
          <div className="grid grid-cols-4 gap-2">
            <input
              type="number"
              placeholder="kcal"
              value={form.macros.kcal || ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  macros: { ...form.macros, kcal: Number(e.target.value) },
                })
              }
              className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
            />
            <input
              type="number"
              placeholder="prot"
              value={form.macros.protein || ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  macros: { ...form.macros, protein: Number(e.target.value) },
                })
              }
              className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
            />
            <input
              type="number"
              placeholder="carbs"
              value={form.macros.carbs || ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  macros: { ...form.macros, carbs: Number(e.target.value) },
                })
              }
              className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
            />
            <input
              type="number"
              placeholder="fat"
              value={form.macros.fat || ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  macros: { ...form.macros, fat: Number(e.target.value) },
                })
              }
              className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              placeholder="Raciones"
              value={form.servings || ""}
              onChange={(e) =>
                setForm({ ...form, servings: Number(e.target.value) })
              }
              className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
            />
            <input
              type="number"
              placeholder="Minutos prep"
              value={form.prep_time_min || ""}
              onChange={(e) =>
                setForm({ ...form, prep_time_min: Number(e.target.value) })
              }
              className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-muted hover:text-text"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-accent text-bg rounded-lg font-medium"
            >
              Crear receta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
