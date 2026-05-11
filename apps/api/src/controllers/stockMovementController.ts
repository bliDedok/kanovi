import { FastifyReply, FastifyRequest } from "fastify";
import { Prisma, StockReason } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../prisma";

const stockMovementQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  reason: z.nativeEnum(StockReason).optional(),
  limit: z.coerce.number().int().min(1).max(500).default(200),
});

const toStartOfDay = (value: string) => {
  const date = new Date(`${value}T00:00:00.000`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const toEndOfDay = (value: string) => {
  const date = new Date(`${value}T23:59:59.999`);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const listStockMovements = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  const parsed = stockMovementQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    return reply.code(400).send({
      error: "INVALID_QUERY",
      message: "Filter riwayat stok tidak valid.",
      details: parsed.error.flatten(),
    });
  }

  const { startDate, endDate, reason, limit } = parsed.data;

  const where: Prisma.StockMovementWhereInput = {};

  if (reason) {
    where.reason = reason;
  }

  if (startDate || endDate) {
    where.createdAt = {};

    if (startDate) {
      const start = toStartOfDay(startDate);

      if (!start) {
        return reply.code(400).send({
          error: "INVALID_START_DATE",
          message: "Format startDate tidak valid.",
        });
      }

      where.createdAt.gte = start;
    }

    if (endDate) {
      const end = toEndOfDay(endDate);

      if (!end) {
        return reply.code(400).send({
          error: "INVALID_END_DATE",
          message: "Format endDate tidak valid.",
        });
      }

      where.createdAt.lte = end;
    }
  }

  const movements = await prisma.stockMovement.findMany({
    where,
    take: limit,
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

  return reply.send({
    ok: true,
    data: movements,
    summary,
  });
};