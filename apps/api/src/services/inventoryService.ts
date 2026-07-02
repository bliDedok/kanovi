import { StockReason } from "@prisma/client";
import { inventoryRepository } from "../repositories/inventoryRepository";

type CreateIngredientInput = {
  name: string;
  stock: number;
  unit: string;
  minStock: number;
};

type UpdateIngredientInput = {
  id: number;
  name?: string;
  stock?: number;
  unit?: string;
  minStock?: number;
};

type AdjustIngredientStockInput = {
  ingredientId: number;
  qtyChange: number;
  reason: StockReason;
};

function withLowStockStatus<T extends { stock: number; minStock: number }>(
  ingredient: T
) {
  return {
    ...ingredient,
    isLowStock: ingredient.stock <= ingredient.minStock,
  };
}

export class InventoryService {
  async getAllIngredients() {
    const ingredients = await inventoryRepository.findAllIngredients();

    return ingredients.map((item) => withLowStockStatus(item));
  }

  async getLowStockIngredients() {
    const ingredients = await inventoryRepository.findLowStockIngredients();

    return ingredients.map((item) => ({
      ...item,
      isLowStock: true,
    }));
  }

  async createIngredient(input: CreateIngredientInput) {
    const existing = await inventoryRepository.findIngredientByName(input.name);

    if (existing) {
      return {
        kind: "DUPLICATE_NAME" as const,
      };
    }

    const ingredient = await inventoryRepository.createIngredient(input);

    return {
      kind: "SUCCESS" as const,
      ingredient: withLowStockStatus(ingredient),
    };
  }

  async updateIngredient(input: UpdateIngredientInput) {
    const existing = await inventoryRepository.findIngredientById(input.id);

    if (!existing) {
      return {
        kind: "NOT_FOUND" as const,
      };
    }

    const updated = await inventoryRepository.updateIngredient(input.id, {
      name: input.name,
      stock: input.stock,
      unit: input.unit,
      minStock: input.minStock,
    });

    return {
      kind: "SUCCESS" as const,
      ingredient: withLowStockStatus(updated),
    };
  }

  async adjustIngredientStock(input: AdjustIngredientStockInput) {
    return inventoryRepository.adjustIngredientStock(input);
  }

  async getIngredientMovements(ingredientId: number) {
    const ingredient = await inventoryRepository.findIngredientById(
      ingredientId
    );

    if (!ingredient) {
      return {
        kind: "NOT_FOUND" as const,
      };
    }

    const movements = await inventoryRepository.findMovementsByIngredientId(
      ingredientId
    );

    return {
      kind: "SUCCESS" as const,
      movements,
    };
  }
}

export const inventoryService = new InventoryService();