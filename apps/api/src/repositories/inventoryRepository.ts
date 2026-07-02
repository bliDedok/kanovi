import { StockReason } from "@prisma/client";
import { prisma } from "../prisma";

export class InventoryRepository {
  findAllIngredients() {
    return prisma.ingredient.findMany({
      orderBy: {
        id: "asc",
      },
    });
  }

  findLowStockIngredients() {
    return prisma.ingredient.findMany({
      where: {
        stock: {
          lte: prisma.ingredient.fields.minStock,
        },
      },
      orderBy: [{ stock: "asc" }, { id: "asc" }],
    });
  }

  findIngredientById(id: number) {
    return prisma.ingredient.findUnique({
      where: { id },
    });
  }

  findIngredientByName(name: string) {
    return prisma.ingredient.findFirst({
      where: {
        name: {
          equals: name,
          mode: "insensitive",
        },
      },
    });
  }

  createIngredient(data: {
    name: string;
    stock: number;
    unit: string;
    minStock: number;
  }) {
    return prisma.ingredient.create({
      data,
    });
  }

  updateIngredient(
    id: number,
    data: {
      name?: string;
      stock?: number;
      unit?: string;
      minStock?: number;
    }
  ) {
    return prisma.ingredient.update({
      where: { id },
      data,
    });
  }

  adjustIngredientStock(input: {
    ingredientId: number;
    qtyChange: number;
    reason: StockReason;
  }) {
    return prisma.$transaction(async (tx) => {
      const ingredient = await tx.ingredient.findUnique({
        where: { id: input.ingredientId },
      });

      if (!ingredient) {
        return {
          kind: "NOT_FOUND" as const,
        };
      }

      const nextStock = ingredient.stock + input.qtyChange;

      if (nextStock < 0) {
        return {
          kind: "NEGATIVE_STOCK" as const,
          currentStock: ingredient.stock,
          qtyChange: input.qtyChange,
        };
      }

      const updatedIngredient = await tx.ingredient.update({
        where: { id: input.ingredientId },
        data: {
          stock: nextStock,
        },
      });

      const movement = await tx.stockMovement.create({
        data: {
          ingredientId: input.ingredientId,
          qtyChange: input.qtyChange,
          reason: input.reason,
        },
      });

      return {
        kind: "SUCCESS" as const,
        updatedIngredient,
        movement,
      };
    });
  }

  findMovementsByIngredientId(ingredientId: number) {
    return prisma.stockMovement.findMany({
      where: {
        ingredientId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }
}

export const inventoryRepository = new InventoryRepository();