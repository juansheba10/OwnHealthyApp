"use client";

import { useEffect, useState } from "react";
import { RefreshCw, Check } from "lucide-react";
import {
  getActiveShoppingList,
  generateShoppingList,
  toggleItem,
} from "./actions";
import type { ShoppingItem } from "@/lib/types";

interface ShoppingList {
  id: string;
  period_start: string;
  period_end: string;
  items: ShoppingItem[];
  status: string;
}

export default function ShoppingPage() {
  const [list, setList] = useState<ShoppingList | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [days, setDays] = useState(7);

  useEffect(() => {
    getActiveShoppingList().then((data) => {
      setList(data as ShoppingList | null);
      setLoading(false);
    });
  }, []);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const newList = await generateShoppingList(days);
      setList(newList as ShoppingList);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error generando lista");
    }
    setGenerating(false);
  }

  async function handleToggle(index: number) {
    if (!list) return;
    const newItems = [...list.items];
    newItems[index] = { ...newItems[index], checked: !newItems[index].checked };
    setList({ ...list, items: newItems });
    await toggleItem(list.id, index, list.items);
  }

  // Group items by category
  const grouped = list?.items.reduce(
    (acc, item, index) => {
      const cat = item.category || "Otros";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push({ ...item, _index: index });
      return acc;
    },
    {} as Record<string, (ShoppingItem & { _index: number })[]>,
  );

  if (loading) {
    return <div className="text-center text-muted py-8">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-4xl uppercase tracking-wide">
          Lista de compra
        </h1>
      </div>

      {/* Generate controls */}
      <div className="flex items-center gap-3">
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text"
        >
          <option value={7}>7 días</option>
          <option value={14}>14 días</option>
          <option value={30}>30 días</option>
        </select>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-bg disabled:opacity-50"
        >
          <RefreshCw size={14} className={generating ? "animate-spin" : ""} />
          {generating ? "Generando..." : "Generar lista"}
        </button>
      </div>

      {/* Period info */}
      {list && (
        <p className="text-xs text-muted">
          Período: {list.period_start} → {list.period_end}
          {" · "}
          {list.items.filter((i) => i.checked).length}/{list.items.length}{" "}
          comprados
        </p>
      )}

      {/* Shopping items grouped by category */}
      {!list ? (
        <div className="text-center text-muted py-8">
          <p>No hay lista activa.</p>
          <p className="text-sm mt-1">Genera una desde tu plan de comidas.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {grouped &&
            Object.entries(grouped).map(([category, items]) => (
              <div key={category}>
                <h3 className="text-xs font-medium text-muted uppercase tracking-wider mb-2">
                  {category}
                </h3>
                <div className="space-y-1">
                  {items.map((item) => (
                    <button
                      key={item._index}
                      onClick={() => handleToggle(item._index)}
                      className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                        item.checked
                          ? "bg-card/50 text-muted line-through"
                          : "bg-card hover:border-accent"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${
                          item.checked
                            ? "bg-accent border-accent"
                            : "border-border"
                        }`}
                      >
                        {item.checked && (
                          <Check size={12} className="text-bg" />
                        )}
                      </div>
                      <span className="flex-1 text-sm">{item.name}</span>
                      <span className="text-xs font-mono text-muted">
                        {item.qty} {item.unit}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
