"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Trash2, Plus } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { MacrosBar } from "@/components/plan/MacrosBar";
import { getDayPlan, updateDayType, updateMeal, deleteMeal, addMeal } from "./actions";
import type { MealItem, DayType } from "@/lib/types";

const DAY_TYPES: { value: DayType; label: string }[] = [
  { value: "training", label: "Entreno" },
  { value: "rest", label: "Descanso" },
  { value: "double", label: "Doble sesión" },
  { value: "football_only", label: "Fútbol" },
];

interface Plan {
  id: string;
  date: string;
  day_type: DayType;
  meals: MealItem[];
  total_kcal: number;
  total_protein: number;
}

export default function DayEditorPage() {
  const params = useParams();
  const router = useRouter();
  const date = params.date as string;
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingMeal, setEditingMeal] = useState<number | null>(null);

  useEffect(() => {
    getDayPlan(date).then((data) => {
      setPlan(data as Plan | null);
      setLoading(false);
    });
  }, [date]);

  const dateObj = new Date(date + "T12:00:00");
  const dayLabel = format(dateObj, "EEEE d 'de' MMMM", { locale: es });

  async function handleDayTypeChange(newType: DayType) {
    if (!plan) return;
    await updateDayType(plan.id, newType);
    setPlan({ ...plan, day_type: newType });
  }

  async function handleDeleteMeal(index: number) {
    if (!plan) return;
    await deleteMeal(plan.id, index, plan.meals);
    const newMeals = plan.meals.filter((_, i) => i !== index);
    setPlan({
      ...plan,
      meals: newMeals,
      total_kcal: newMeals.reduce((s, m) => s + m.kcal, 0),
      total_protein: newMeals.reduce((s, m) => s + (m.protein ?? 0), 0),
    });
  }

  async function handleSaveMeal(index: number, meal: MealItem) {
    if (!plan) return;
    await updateMeal(plan.id, index, meal, plan.meals);
    const newMeals = [...plan.meals];
    newMeals[index] = meal;
    setPlan({
      ...plan,
      meals: newMeals,
      total_kcal: newMeals.reduce((s, m) => s + m.kcal, 0),
      total_protein: newMeals.reduce((s, m) => s + (m.protein ?? 0), 0),
    });
    setEditingMeal(null);
  }

  async function handleAddMeal() {
    if (!plan) return;
    const newMeal: MealItem = {
      time: "12:00",
      label: "Comida",
      name: "Nueva comida",
      items: [],
      kcal: 0,
    };
    await addMeal(plan.id, newMeal, plan.meals);
    const newMeals = [...plan.meals, newMeal];
    setPlan({
      ...plan,
      meals: newMeals,
      total_kcal: newMeals.reduce((s, m) => s + m.kcal, 0),
      total_protein: newMeals.reduce((s, m) => s + (m.protein ?? 0), 0),
    });
    setEditingMeal(newMeals.length - 1);
  }

  if (loading) {
    return <div className="text-center text-muted py-8">Cargando...</div>;
  }

  if (!plan) {
    return (
      <div className="text-center text-muted py-8">
        No hay plan para este día
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg hover:bg-card"
        >
          <ArrowLeft size={20} className="text-muted" />
        </button>
        <div>
          <h1 className="font-display text-3xl uppercase tracking-wide capitalize">
            {dayLabel}
          </h1>
        </div>
      </div>

      {/* Day type selector */}
      <div className="flex gap-2 flex-wrap">
        {DAY_TYPES.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => handleDayTypeChange(value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              plan.day_type === value
                ? "bg-accent text-bg"
                : "bg-card text-muted hover:text-text border border-border"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Macros summary */}
      <div className="rounded-xl border border-border bg-card p-4">
        <MacrosBar
          kcal={plan.total_kcal}
          protein={plan.total_protein}
          targetKcal={2850}
          targetProtein={190}
        />
      </div>

      {/* Meals list */}
      <div className="space-y-3">
        {plan.meals.map((meal, index) => (
          <div
            key={index}
            className="rounded-xl border border-border bg-card p-4"
          >
            {editingMeal === index ? (
              <MealEditor
                meal={meal}
                onSave={(m) => handleSaveMeal(index, m)}
                onCancel={() => setEditingMeal(null)}
              />
            ) : (
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted">
                      {meal.time}
                    </span>
                    <span className="text-xs text-accent">{meal.label}</span>
                  </div>
                  <p className="text-sm font-medium mt-1">{meal.name}</p>
                  <p className="text-xs text-muted mt-1">
                    {meal.items.join(" · ")}
                  </p>
                  <p className="text-xs font-mono text-muted mt-1">
                    {meal.kcal} kcal
                    {meal.protein && ` · ${meal.protein}g prot`}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setEditingMeal(index)}
                    className="p-1.5 rounded hover:bg-surface text-muted hover:text-text text-xs"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDeleteMeal(index)}
                    className="p-1.5 rounded hover:bg-surface text-muted hover:text-pink"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add meal button */}
      <button
        onClick={handleAddMeal}
        className="w-full rounded-xl border border-dashed border-border bg-card p-4 text-sm text-muted hover:text-accent hover:border-accent transition-colors flex items-center justify-center gap-2"
      >
        <Plus size={16} />
        Añadir comida
      </button>
    </div>
  );
}

/* Inline meal editor */
function MealEditor({
  meal,
  onSave,
  onCancel,
}: {
  meal: MealItem;
  onSave: (m: MealItem) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState(meal);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <input
          type="time"
          value={form.time}
          onChange={(e) => setForm({ ...form, time: e.target.value })}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text"
        />
        <input
          type="text"
          value={form.label}
          onChange={(e) => setForm({ ...form, label: e.target.value })}
          placeholder="Etiqueta"
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text"
        />
      </div>
      <input
        type="text"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        placeholder="Nombre de la comida"
        className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text"
      />
      <input
        type="text"
        value={form.items.join(", ")}
        onChange={(e) =>
          setForm({ ...form, items: e.target.value.split(", ") })
        }
        placeholder="Ingredientes (separados por coma)"
        className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text"
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          type="number"
          value={form.kcal}
          onChange={(e) => setForm({ ...form, kcal: Number(e.target.value) })}
          placeholder="kcal"
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text"
        />
        <input
          type="number"
          value={form.protein ?? 0}
          onChange={(e) =>
            setForm({ ...form, protein: Number(e.target.value) })
          }
          placeholder="Proteína (g)"
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text"
        />
      </div>
      <div className="flex gap-2 justify-end">
        <button
          onClick={onCancel}
          className="px-3 py-1.5 text-xs text-muted hover:text-text"
        >
          Cancelar
        </button>
        <button
          onClick={() => onSave(form)}
          className="px-3 py-1.5 text-xs bg-accent text-bg rounded-lg font-medium"
        >
          Guardar
        </button>
      </div>
    </div>
  );
}
