import type { ShoppingItem } from "@/lib/types";

const CATEGORY_MAP: Record<string, string> = {
  pollo: "Proteínas",
  pechuga: "Proteínas",
  ternera: "Proteínas",
  carne: "Proteínas",
  pavo: "Proteínas",
  jamón: "Proteínas",
  huevo: "Proteínas",
  clara: "Proteínas",
  whey: "Proteínas",
  proteína: "Proteínas",
  yogur: "Lácteos",
  queso: "Lácteos",
  leche: "Lácteos",
  cottage: "Lácteos",
  arroz: "Cereales y pasta",
  pasta: "Cereales y pasta",
  penne: "Cereales y pasta",
  pan: "Cereales y pasta",
  tortilla: "Cereales y pasta",
  avena: "Cereales y pasta",
  brócoli: "Verduras",
  calabacín: "Verduras",
  champiñón: "Verduras",
  espinaca: "Verduras",
  tomate: "Verduras",
  pepino: "Verduras",
  cebolla: "Verduras",
  pimiento: "Verduras",
  zanahoria: "Verduras",
  apio: "Verduras",
  boniato: "Verduras",
  patata: "Verduras",
  ajo: "Verduras",
  plátano: "Frutas",
  arándano: "Frutas",
  limón: "Frutas",
  garbanzo: "Legumbres",
  hummus: "Legumbres",
  nuez: "Frutos secos",
  aceite: "Despensa",
  salsa: "Despensa",
  soja: "Despensa",
  curry: "Despensa",
  canela: "Despensa",
  miel: "Despensa",
  orégano: "Despensa",
  perejil: "Despensa",
  jengibre: "Despensa",
  caldo: "Despensa",
  coco: "Despensa",
  sésamo: "Despensa",
  hielo: "Otros",
};

function categorize(name: string): string {
  const lower = name.toLowerCase();
  for (const [keyword, category] of Object.entries(CATEGORY_MAP)) {
    if (lower.includes(keyword)) return category;
  }
  return "Otros";
}

interface MealPlanForShopping {
  meals: { items: string[] }[];
}

export function aggregateShoppingList(
  plans: MealPlanForShopping[],
): ShoppingItem[] {
  const itemMap = new Map<string, ShoppingItem>();

  for (const plan of plans) {
    for (const meal of plan.meals) {
      for (const item of meal.items) {
        // Try to parse "150g arroz integral" or "1 plátano"
        const match = item.match(
          /^(\d+(?:\.\d+)?)\s*(g|ml|unidad(?:es)?|rebanadas?|cubos?|dientes?)?\s*(.+)$/i,
        );

        let name: string;
        let qty: number;
        let unit: string;

        if (match) {
          qty = parseFloat(match[1]);
          unit = match[2] ?? "unidad";
          name = match[3].trim();
        } else {
          name = item;
          qty = 1;
          unit = "unidad";
        }

        const key = name.toLowerCase();
        const existing = itemMap.get(key);

        if (existing && existing.unit === unit) {
          existing.qty += qty;
        } else if (!existing) {
          itemMap.set(key, {
            name,
            qty,
            unit,
            category: categorize(name),
            checked: false,
          });
        }
      }
    }
  }

  return Array.from(itemMap.values()).sort((a, b) =>
    a.category.localeCompare(b.category),
  );
}
