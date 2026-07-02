import { prisma } from "../prisma";

export type StockRequirement = {
  ingredientId: number;
  ingredientName: string;
  unit: string;
  stock: number;
  need: number;
  shortBy: number;
};

export function buildStockRequirements(
  details: Array<{ menuId: number; qty: number }>,
  recipes: Array<{ menuId: number; ingredientId: number; amountNeeded: number }>,
  ingredients: Array<{ id: number; name: string; stock: number; unit: string }>
): StockRequirement[] {
  const qtyByMenu = new Map<number, number>();

  for (const d of details) {
    qtyByMenu.set(d.menuId, (qtyByMenu.get(d.menuId) ?? 0) + d.qty);
  }

  const totalNeeded = new Map<number, number>();

  for (const r of recipes) {
    const qty = qtyByMenu.get(r.menuId) ?? 0;
    const need = r.amountNeeded * qty;

    totalNeeded.set(
      r.ingredientId,
      (totalNeeded.get(r.ingredientId) ?? 0) + need
    );
  }

  const ingredientMap = new Map(ingredients.map((item) => [item.id, item]));

  return [...totalNeeded.entries()].map(([ingredientId, need]) => {
    const ingredient = ingredientMap.get(ingredientId);

    if (!ingredient) {
      throw new Error(`Ingredient ${ingredientId} not found`);
    }

    const shortBy = Math.max(need - ingredient.stock, 0);

    return {
      ingredientId,
      ingredientName: ingredient.name,
      unit: ingredient.unit,
      stock: ingredient.stock,
      need,
      shortBy,
    };
  });
}

export async function getOrderStockSummary(orderId: number) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { details: true },
  });

  if (!order) return null;

  const menuIds = [...new Set(order.details.map((d) => d.menuId))];

  const recipes = menuIds.length
    ? await prisma.recipe.findMany({
        where: { menuId: { in: menuIds } },
      })
    : [];

  const ingredientIds = [...new Set(recipes.map((r) => r.ingredientId))];

  const ingredients = ingredientIds.length
    ? await prisma.ingredient.findMany({
        where: { id: { in: ingredientIds } },
      })
    : [];

  const requirements = buildStockRequirements(order.details, recipes, ingredients);
  const shortages = requirements.filter((item) => item.shortBy > 0);

  return {
    order,
    requirements,
    shortages,
  };
}