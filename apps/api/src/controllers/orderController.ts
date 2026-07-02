import { FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { orderService } from "../services/orderService";

const orderItemSchema = z.object({
  menuId: z.number().int().positive(),
  qty: z.number().int().positive(),
});

const orderCreateSchema = z.object({
  origin: z.enum(["COUNTER", "KITCHEN", "BAR"]),
  customerName: z.string().trim().min(1).optional(),
  items: z.array(orderItemSchema).min(1),
  branch: z.enum(["PUSAT", "RESTART"]).optional(),
  sessionId: z.number().int().positive().optional(),
});

const paySchema = z.object({
  paymentMethod: z.enum(["CASH", "QRIS"]),
  overrideStock: z.boolean().optional().default(false),
  overrideNote: z.string().trim().optional(),
});

const voidSchema = z.object({
  pin: z.string().min(1, "PIN wajib diisi"),
  reason: z.string().trim().min(3, "Alasan void wajib diisi minimal 3 karakter"),
  voidedBy: z.string().trim().optional(),
});

export const createOrder = async (req: FastifyRequest, reply: FastifyReply) => {
  const parsed = orderCreateSchema.safeParse(req.body);

  if (!parsed.success) {
    return reply.code(400).send({ error: parsed.error.flatten() });
  }

  const userId = (req as any).user?.id || (req as any).user?.userId;

  if (!userId) {
    return reply
      .code(401)
      .send({ error: "Unauthorized: User ID tidak ditemukan dalam token." });
  }

  const result = await orderService.createOrder({
    ...parsed.data,
    userId: Number(userId),
  });

  if (result.kind === "MENU_NOT_FOUND") {
    return reply.code(400).send({
      error: "Ada menu yang tidak ditemukan.",
    });
  }

  if (result.kind === "MENU_NOT_AVAILABLE") {
    return reply.code(409).send({
      error: "MENU_NOT_AVAILABLE",
      message: "Ada menu yang sedang tidak tersedia.",
      menus: result.menus,
    });
  }

  return reply.send(result.order);
};

export const checkOrderStock = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  const id = Number((req.params as any).id);

  if (!Number.isFinite(id)) {
    return reply.code(400).send({ error: "Invalid id" });
  }

  const result = await orderService.checkOrderStock(id);

  if (result.kind === "NOT_FOUND") {
    return reply.code(404).send({ error: "Order not found" });
  }

  return reply.send({
    ok: true,
    orderId: result.orderId,
    hasShortage: result.hasShortage,
    requirements: result.requirements,
    shortages: result.shortages,
  });
};

export const payOrder = async (req: FastifyRequest, reply: FastifyReply) => {
  const parsed = paySchema.safeParse(req.body);

  if (!parsed.success) {
    return reply.code(400).send({ error: parsed.error.flatten() });
  }

  const id = Number((req.params as any).id);

  if (!Number.isFinite(id)) {
    return reply.code(400).send({ error: "Invalid id" });
  }

  const result = await orderService.payOrder({
    orderId: id,
    ...parsed.data,
  });

  if (result.kind === "NOT_FOUND") {
    return reply.code(404).send({ error: "Order not found" });
  }

  if (result.kind === "VOID") {
    return reply.code(409).send({ error: "Order already VOID" });
  }

  if (result.kind === "MENU_NOT_AVAILABLE") {
    return reply.code(409).send({
      error: "MENU_NOT_AVAILABLE",
      message: "Ada menu yang sedang tidak tersedia.",
      menus: result.menus,
    });
  }

  if (result.kind === "SHORTAGE") {
    return reply.code(409).send({
      error: "STOCK_NOT_ENOUGH",
      shortages: result.shortages,
    });
  }

  if (result.kind === "ALREADY_PAID") {
    return reply.send({
      ok: true,
      alreadyPaid: true,
      order: result.order,
    });
  }

  return reply.send({
    ok: true,
    alreadyPaid: false,
    order: result.order,
    shortages: result.shortages,
  });
};

export const voidOrder = async (req: FastifyRequest, reply: FastifyReply) => {
  const parsed = voidSchema.safeParse(req.body);

  if (!parsed.success) {
    return reply.code(400).send({ error: parsed.error.flatten() });
  }

  const id = Number((req.params as any).id);

  if (!Number.isFinite(id)) {
    return reply.code(400).send({ error: "Invalid id" });
  }

  try {
    const result = await orderService.voidOrder({
      orderId: id,
      ...parsed.data,
    });

    if (result.kind === "INVALID_PIN") {
      return reply
        .code(403)
        .send({ error: "PIN Manager Salah. Otorisasi VOID ditolak." });
    }

    if (result.kind === "NOT_FOUND") {
      return reply.code(404).send({ error: "Order tidak ditemukan." });
    }

    if (result.kind === "ALREADY_VOID") {
      return reply.code(400).send({
        error: "Order ini sudah pernah di-VOID.",
      });
    }

    return reply.send({
      ok: true,
      message:
        "Transaksi berhasil di-VOID. Stok bahan baku telah dikembalikan ke sistem.",
      order: result.order,
      voidAudit: {
        reason: result.order.voidReason,
        voidedBy: result.order.voidedBy,
        voidedAt: result.order.voidedAt,
      },
    });
  } catch (error: any) {
    return reply.code(500).send({ error: error.message });
  }
};