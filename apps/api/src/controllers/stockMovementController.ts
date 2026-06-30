import { FastifyReply, FastifyRequest } from "fastify";
import { StockReason } from "@prisma/client";
import { z } from "zod";
import { stockMovementService } from "../services/stockMovementService";

const stockMovementQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  reason: z.nativeEnum(StockReason).optional(),
  limit: z.coerce.number().int().min(1).max(500).default(200),
});

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

  const result = await stockMovementService.listStockMovements(parsed.data);

  if (result.kind === "INVALID_START_DATE") {
    return reply.code(400).send({
      error: "INVALID_START_DATE",
      message: "Format startDate tidak valid.",
    });
  }

  if (result.kind === "INVALID_END_DATE") {
    return reply.code(400).send({
      error: "INVALID_END_DATE",
      message: "Format endDate tidak valid.",
    });
  }

  return reply.send({
    ok: true,
    data: result.movements,
    summary: result.summary,
  });
};