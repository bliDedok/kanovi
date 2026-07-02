import { Prisma, StockReason } from "@prisma/client";
import { stockMovementRepository } from "../repositories/stockMovementRepository";

type ListStockMovementInput = {
  startDate?: string;
  endDate?: string;
  reason?: StockReason;
  limit: number;
};

const toStartOfDay = (value: string) => {
  const date = new Date(`${value}T00:00:00.000`);

  return Number.isNaN(date.getTime()) ? null : date;
};

const toEndOfDay = (value: string) => {
  const date = new Date(`${value}T23:59:59.999`);

  return Number.isNaN(date.getTime()) ? null : date;
};

export class StockMovementService {
  async listStockMovements(input: ListStockMovementInput) {
    const where: Prisma.StockMovementWhereInput = {};

    if (input.reason) {
      where.reason = input.reason;
    }

    if (input.startDate || input.endDate) {
      where.createdAt = {};

      if (input.startDate) {
        const start = toStartOfDay(input.startDate);

        if (!start) {
          return {
            kind: "INVALID_START_DATE" as const,
          };
        }

        where.createdAt.gte = start;
      }

      if (input.endDate) {
        const end = toEndOfDay(input.endDate);

        if (!end) {
          return {
            kind: "INVALID_END_DATE" as const,
          };
        }

        where.createdAt.lte = end;
      }
    }

    const movements = await stockMovementRepository.findStockMovements({
      where,
      limit: input.limit,
    });

    const summary = movements.reduce(
      (result, movement) => {
        if (movement.qtyChange > 0) {
          result.stockIn += movement.qtyChange;
        }

        if (movement.qtyChange < 0) {
          result.stockOut += Math.abs(movement.qtyChange);
        }

        return result;
      },
      {
        stockIn: 0,
        stockOut: 0,
        totalMovements: movements.length,
      }
    );

    return {
      kind: "SUCCESS" as const,
      movements,
      summary,
    };
  }
}

export const stockMovementService = new StockMovementService();