"use client";

import { useEffect, useState } from "react";
import {
  Search,
  Plus,
  Clock,
  Flame,
  X,
  Users,
  Sparkles,
  Trash2,
  Heart,
  Copy,
  Pencil,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  getRecipes,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  duplicateRecipe,
  toggleFavorite,
  type RecipeInput,
  type RecipeRow,
} from "./actions";

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
  const [recipes, setRecipes] = useState<RecipeRow[]>([]);
  const [search, setSearch] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<RecipeRow | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeRow | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRecipes().then((data) => {
      setRecipes(data);
      setLoading(false);
    });
    createClient()
      .auth.getUser()
      .then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const filtered = recipes.filter((r) => {
    const matchesSearch =
      !search || r.title.toLowerCase().includes(search.toLowerCase());
    const matchesTags =
      selectedTags.length === 0 ||
      selectedTags.some((tag) => r.tags.includes(tag));
    const matchesFavorite = !favoritesOnly || r.is_favorite;
    return matchesSearch && matchesTags && matchesFavorite;
  });

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  async function handleCreate(recipe: RecipeInput) {
    await createRecipe(recipe);
    setRecipes(await getRecipes());
    setShowCreateModal(false);
  }

  async function handleUpdate(id: string, recipe: RecipeInput) {
    await updateRecipe(id, recipe);
    const updated = await getRecipes();
    setRecipes(updated);
    setEditingRecipe(null);
    setSelectedRecipe(updated.find((r) => r.id === id) ?? null);
  }

  async function handleDelete(id: string) {
    await deleteRecipe(id);
    setRecipes((prev) => prev.filter((r) => r.id !== id));
    setSelectedRecipe(null);
  }

  async function handleDuplicate(id: string) {
    const copy = await duplicateRecipe(id);
    setRecipes(await getRecipes());
    setSelectedRecipe(null);
    setEditingRecipe(copy);
  }

  async function handleToggleFavorite(recipe: RecipeRow) {
    const next = !recipe.is_favorite;
    setRecipes((prev) =>
      prev.map((r) => (r.id === recipe.id ? { ...r, is_favorite: next } : r)),
    );
    if (selectedRecipe?.id === recipe.id) {
      setSelectedRecipe({ ...recipe, is_favorite: next });
    }
    try {
      await toggleFavorite(recipe.id, next);
    } catch {
      setRecipes((prev) =>
        prev.map((r) =>
          r.id === recipe.id ? { ...r, is_favorite: !next } : r,
        ),
      );
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-4xl uppercase tracking-wide">
          Recetas
        </h1>
        <button
          onClick={() => setShowCreateModal(true)}
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

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setFavoritesOnly((v) => !v)}
          className={`shrink-0 flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            favoritesOnly
              ? "bg-pink/20 text-pink border border-pink/40"
              : "bg-card text-muted border border-border hover:text-text"
          }`}
        >
          <Heart size={12} fill={favoritesOnly ? "currentColor" : "none"} />
          Favoritas
        </button>
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
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onClick={() => setSelectedRecipe(recipe)}
              onToggleFavorite={() => handleToggleFavorite(recipe)}
            />
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
          canEdit={canMutate(selectedRecipe, userId)}
          onClose={() => setSelectedRecipe(null)}
          onDelete={handleDelete}
          onDuplicate={handleDuplicate}
          onEdit={() => {
            setEditingRecipe(selectedRecipe);
            setSelectedRecipe(null);
          }}
          onToggleFavorite={() => handleToggleFavorite(selectedRecipe)}
        />
      )}

      {/* Create modal */}
      {showCreateModal && (
        <RecipeModal
          mode="create"
          onSave={handleCreate}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {/* Edit modal */}
      {editingRecipe && (
        <RecipeModal
          mode="edit"
          initial={editingRecipe}
          onSave={(r) => handleUpdate(editingRecipe.id, r)}
          onClose={() => setEditingRecipe(null)}
        />
      )}
    </div>
  );
}

function canMutate(recipe: RecipeRow, userId: string | null): boolean {
  // Mirrors the RLS policy: creator (or legacy unowned rows) can edit/delete.
  return recipe.created_by === null || recipe.created_by === userId;
}

function RecipeCard({
  recipe,
  onClick,
  onToggleFavorite,
}: {
  recipe: RecipeRow;
  onClick: () => void;
  onToggleFavorite: () => void;
}) {
  return (
    <div className="relative">
      <button
        onClick={onClick}
        className="rounded-xl border border-border bg-card p-4 hover:border-accent/50 transition-colors text-left w-full"
      >
        <h3 className="text-sm font-medium text-text pr-7">{recipe.title}</h3>
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
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite();
        }}
        aria-label={
          recipe.is_favorite ? "Quitar de favoritas" : "Marcar favorita"
        }
        className={`absolute top-3 right-3 p-1.5 rounded-full transition-colors ${
          recipe.is_favorite
            ? "text-pink hover:bg-pink/10"
            : "text-muted hover:text-pink hover:bg-card"
        }`}
      >
        <Heart size={16} fill={recipe.is_favorite ? "currentColor" : "none"} />
      </button>
    </div>
  );
}

function RecipeDetailModal({
  recipe,
  canEdit,
  onClose,
  onDelete,
  onDuplicate,
  onEdit,
  onToggleFavorite,
}: {
  recipe: RecipeRow;
  canEdit: boolean;
  onClose: () => void;
  onDelete: (id: string) => Promise<void>;
  onDuplicate: (id: string) => Promise<void>;
  onEdit: () => void;
  onToggleFavorite: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState<"delete" | "duplicate" | null>(null);

  async function handleDelete() {
    setBusy("delete");
    try {
      await onDelete(recipe.id);
    } finally {
      setBusy(null);
    }
  }

  async function handleDuplicate() {
    setBusy("duplicate");
    try {
      await onDuplicate(recipe.id);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-xl border border-border bg-surface p-6 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-3xl uppercase tracking-wide break-words">
              {recipe.title}
            </h2>
            <p className="text-sm text-muted mt-1">{recipe.subtitle}</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={onToggleFavorite}
              className={`p-1 rounded hover:bg-card shrink-0 ${
                recipe.is_favorite ? "text-pink" : "text-muted hover:text-pink"
              }`}
              title={
                recipe.is_favorite ? "Quitar de favoritas" : "Marcar favorita"
              }
            >
              <Heart
                size={18}
                fill={recipe.is_favorite ? "currentColor" : "none"}
              />
            </button>
            <button
              onClick={handleDuplicate}
              disabled={busy !== null}
              className="p-1 rounded hover:bg-card text-muted hover:text-text shrink-0 disabled:opacity-50"
              title="Duplicar y editar"
            >
              <Copy size={18} />
            </button>
            {canEdit && (
              <button
                onClick={onEdit}
                className="p-1 rounded hover:bg-card text-muted hover:text-text shrink-0"
                title="Editar receta"
              >
                <Pencil size={18} />
              </button>
            )}
            {canEdit && (
              <>
                {confirmDelete ? (
                  <>
                    <span className="text-xs text-muted mr-1">¿Eliminar?</span>
                    <button
                      onClick={handleDelete}
                      disabled={busy !== null}
                      className="px-2.5 py-1 text-xs rounded-lg bg-pink/10 text-pink border border-pink/30 hover:bg-pink/20 disabled:opacity-50"
                    >
                      {busy === "delete" ? "…" : "Sí"}
                    </button>
                    <button
                      onClick={() => setConfirmDelete(false)}
                      className="px-2.5 py-1 text-xs rounded-lg bg-card text-muted border border-border hover:text-text"
                    >
                      No
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="p-1 rounded hover:bg-card text-muted hover:text-pink shrink-0"
                    title="Eliminar receta"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-card text-muted hover:text-text shrink-0"
            >
              <X size={20} />
            </button>
          </div>
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
                  <span className="text-[10px] text-muted italic">
                    (opcional)
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Steps */}
        {recipe.steps && (
          <div>
            <h3 className="text-sm font-semibold text-text mb-2">
              Preparación
            </h3>
            <div className="space-y-2">
              {recipe.steps
                .split(/\d+\.\s*/)
                .filter(Boolean)
                .map((step, i) => (
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

const EMPTY_FORM: RecipeInput = {
  title: "",
  subtitle: "",
  tags: [],
  ingredients: [],
  steps: "",
  macros: { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  servings: 1,
  prep_time_min: 0,
  pairing_notes: "",
};

function recipeToInput(r: RecipeRow): RecipeInput {
  return {
    title: r.title,
    subtitle: r.subtitle ?? "",
    tags: r.tags ?? [],
    ingredients: r.ingredients ?? [],
    steps: r.steps ?? "",
    macros: r.macros ?? { kcal: 0, protein: 0, carbs: 0, fat: 0 },
    servings: r.servings ?? 1,
    prep_time_min: r.prep_time_min ?? 0,
    pairing_notes: r.pairing_notes ?? "",
  };
}

function RecipeModal({
  mode,
  initial,
  onSave,
  onClose,
}: {
  mode: "create" | "edit";
  initial?: RecipeRow;
  onSave: (r: RecipeInput) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<RecipeInput>(
    initial ? recipeToInput(initial) : EMPTY_FORM,
  );
  const [aiPrompt, setAiPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  async function handleGenerate() {
    if (!aiPrompt.trim()) return;
    setGenerating(true);
    setAiError(null);
    try {
      const res = await fetch("/api/recipes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt }),
      });
      const data = await res.json();
      if (!res.ok || !data.recipe) {
        setAiError(data.error ?? "No se pudo generar la receta");
        return;
      }
      const r = data.recipe as Partial<RecipeInput>;
      setForm({
        title: r.title ?? "",
        subtitle: r.subtitle ?? "",
        tags: Array.isArray(r.tags) ? r.tags : [],
        ingredients: Array.isArray(r.ingredients) ? r.ingredients : [],
        steps: r.steps ?? "",
        macros: r.macros ?? { kcal: 0, protein: 0, carbs: 0, fat: 0 },
        servings: r.servings ?? 1,
        prep_time_min: r.prep_time_min ?? 0,
        pairing_notes: r.pairing_notes ?? "",
      });
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "Error al generar");
    } finally {
      setGenerating(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave(form);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 p-4">
      <div className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-xl border border-border bg-surface p-6 space-y-4">
        <h2 className="font-display text-2xl uppercase">
          {mode === "edit" ? "Editar receta" : "Nueva receta"}
        </h2>

        {mode === "create" && (
          <div className="rounded-lg border border-accent/30 bg-accent/5 p-3 space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-accent">
              <Sparkles size={14} />
              Generar con IA
            </div>
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Ej: Bowl de salmón ahumado con quinoa y espinacas, alta en proteína para post-entreno"
              rows={2}
              disabled={generating}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-text placeholder:text-muted focus:border-accent focus:outline-none disabled:opacity-60"
            />
            <div className="flex items-center justify-between gap-2">
              {aiError ? (
                <p
                  className="text-xs text-pink flex-1 truncate"
                  title={aiError}
                >
                  {aiError}
                </p>
              ) : (
                <p className="text-xs text-muted flex-1">
                  La IA rellenará el formulario. Revísalo antes de guardar.
                </p>
              )}
              <button
                type="button"
                onClick={handleGenerate}
                disabled={generating || !aiPrompt.trim()}
                className="shrink-0 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-bg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating ? "Generando…" : "Generar"}
              </button>
            </div>
          </div>
        )}

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
          {form.ingredients.length > 0 && (
            <div className="rounded-lg border border-border bg-card p-3 space-y-1.5">
              <p className="text-xs uppercase tracking-wide text-muted font-mono">
                Ingredientes ({form.ingredients.length})
              </p>
              <ul className="space-y-0.5">
                {form.ingredients.map((ing, i) => (
                  <li key={i} className="text-xs text-text">
                    <span className="text-muted">·</span> {ing.qty} {ing.unit}{" "}
                    {ing.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <textarea
            placeholder="Pasos (markdown)"
            value={form.steps}
            onChange={(e) => setForm({ ...form, steps: e.target.value })}
            rows={3}
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-text focus:border-accent focus:outline-none"
          />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
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
              {mode === "edit" ? "Guardar cambios" : "Crear receta"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
