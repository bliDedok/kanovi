import { Prisma } from "@prisma/client";
import { prisma } from "../prisma";

export class StockMovementRepository {
  findStockMovements(input: {
    where: Prisma.StockMovementWhereInput;
    limit: number;
  }) {
    return prisma.stockMovement.findMany({
      where: input.where,
      take: input.limit,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        ingredient: {
          select: {
            id: true,
            name: true,
            unit: true,
            stock: true,
            minStock: true,
          },
        },
        order: {
          select: {
            id: true,
            customerName: true,
            totalPrice: true,
            paymentMethod: true,
            orderedAt: true,
            paidAt: true,
          },
        },
      },
    });
  }
}

export const stockMovementRepository = new StockMovementRepository();