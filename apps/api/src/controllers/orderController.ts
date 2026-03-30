import { FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { prisma } from "../prisma";

// ====== 1. SCHEMA VALIDASI (ZOD) ======
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

// --- SCHEMA BARU UNTUK VOID ---
const voidSchema = z.object({
  pin: z.string().min(1, "PIN wajib diisi"),
});

// ====== 2. HELPER FUNGSI STOK (TIDAK DISENTUH) ======
type StockRequirement = {
  ingredientId: number;
  ingredientName: string;
  unit: string;
  stock: number;
  need: number;
  shortBy: number;
};

function buildStockRequirements(
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
    totalNeeded.set(r.ingredientId, (totalNeeded.get(r.ingredientId) ?? 0) + need);
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

async function getOrderStockSummary(orderId: number) {
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

// ====== 3. FUNGSI CONTROLLER ======

export const createOrder = async (req: FastifyRequest, reply: FastifyReply) => {
  const parsed = orderCreateSchema.safeParse(req.body);

  if (!parsed.success) {
    return reply.code(400).send({ error: parsed.error.flatten() });
  }

  const userId = (req as any).user?.id || (req as any).user?.userId;

  if (!userId) {
    return reply.code(401).send({ error: "Unauthorized: User ID tidak ditemukan dalam token." });
  }

  const { origin, customerName, items, branch, sessionId } = parsed.data;

  const menus = await prisma.menu.findMany({
    where: { id: { in: items.map((i) => i.menuId) } },
    select: {
      id: true,
      price: true,
      prepStation: true,
    },
  });

  const menuMap = new Map(menus.map((m) => [m.id, m]));

  if (menus.length !== new Set(items.map((i) => i.menuId)).size) {
    return reply.code(400).send({ error: "Ada menu yang tidak ditemukan." });
  }

  const details = items.map((i) => {
  const menu = menuMap.get(i.menuId)!;
  const subtotal = menu.price * i.qty;

    return {
      menuId: menu.id,
      qty: i.qty,
      price: menu.price,
      subtotal,
      prepStation: menu.prepStation,
      prepStatus: "PENDING" as const,
    };
  });

  const totalPrice = details.reduce((sum, item) => sum + item.subtotal, 0);

  const order = await prisma.order.create({
    data: {
      userId: Number(userId),
      origin,
      customerName,
      totalPrice,
      branch: branch || "PUSAT",
      sessionId: sessionId || null,
      paymentStatus: "UNPAID",
      details: {
        create: details,
      },
    },
    include: { details: true },
  });

  return reply.send(order);
};

export const checkOrderStock = async (req: FastifyRequest, reply: FastifyReply) => {
  const id = Number((req.params as any).id);

  if (!Number.isFinite(id)) {
    return reply.code(400).send({ error: "Invalid id" });
  }

  const summary = await getOrderStockSummary(id);

  if (!summary) {
    return reply.code(404).send({ error: "Order not found" });
  }

  return reply.send({
    ok: true,
    orderId: summary.order.id,
    hasShortage: summary.shortages.length > 0,
    requirements: summary.requirements,
    shortages: summary.shortages,
  });
};

export const payOrder = async (req: FastifyRequest, reply: FastifyReply) => {
  const parsed = paySchema.safeParse(req.body);

  if (!parsed.success) {
    return reply.code(400).send({ error: parsed.error.flatten() });
  }

  const { paymentMethod, overrideStock, overrideNote } = parsed.data;
  const id = Number((req.params as any).id);

  if (!Number.isFinite(id)) {
    return reply.code(400).send({ error: "Invalid id" });
  }

  const txResult = await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(
      `SELECT id FROM "Order" WHERE id = ${id} FOR UPDATE`
    );

    const lockedOrder = await tx.order.findUnique({
      where: { id },
      include: { details: true },
    });

    if (!lockedOrder) {
      return { kind: "NOT_FOUND" as const };
    }

    if (lockedOrder.paymentStatus === "PAID") {
      return {
        kind: "ALREADY_PAID" as const,
        order: lockedOrder,
      };
    }

    if (lockedOrder.paymentStatus === "VOID") {
      return { kind: "VOID" as const };
    }

    const menuIds = [...new Set(lockedOrder.details.map((d) => d.menuId))];

    const recipes = menuIds.length
      ? await tx.recipe.findMany({
          where: { menuId: { in: menuIds } },
        })
      : [];

    const ingredientIds = [...new Set(recipes.map((r) => r.ingredientId))];

    if (ingredientIds.length) {
      await tx.$executeRawUnsafe(
        `SELECT id FROM "Ingredient" WHERE id IN (${ingredientIds.join(",")}) FOR UPDATE`
      );
    }

    const lockedIngredients = ingredientIds.length
      ? await tx.ingredient.findMany({
          where: { id: { in: ingredientIds } },
        })
      : [];

    const requirements = buildStockRequirements(
      lockedOrder.details,
      recipes,
      lockedIngredients
    );

    const shortages = requirements.filter((item) => item.shortBy > 0);

    if (shortages.length > 0 && !overrideStock) {
      return {
        kind: "SHORTAGE" as const,
        shortages,
      };
    }

    const didOverride = shortages.length > 0 && overrideStock;

    const paidOrder = await tx.order.update({
      where: { id: lockedOrder.id },
      data: {
        paymentStatus: "PAID",
        paymentMethod,
        stockOverride: didOverride,
        overrideNote: didOverride ? overrideNote : null,
        paidAt: lockedOrder.paidAt ?? new Date(),
      },
      include: { details: true },
    });

    for (const item of requirements) {
      await tx.ingredient.update({
        where: { id: item.ingredientId },
        data: { stock: { decrement: item.need } },
      });

      await tx.stockMovement.create({
        data: {
          ingredientId: item.ingredientId,
          qtyChange: -item.need,
          reason: didOverride ? "SALE_OVERRIDE" : "SALE",
          orderId: lockedOrder.id,
        },
      });
    }

    return {
      kind: "PAID" as const,
      order: paidOrder,
      shortages,
    };
  });

  if (txResult.kind === "NOT_FOUND") {
    return reply.code(404).send({ error: "Order not found" });
  }

  if (txResult.kind === "VOID") {
    return reply.code(409).send({ error: "Order already VOID" });
  }

  if (txResult.kind === "SHORTAGE") {
    return reply.code(409).send({
      error: "STOCK_NOT_ENOUGH",
      shortages: txResult.shortages,
    });
  }

  if (txResult.kind === "ALREADY_PAID") {
    return reply.send({
      ok: true,
      alreadyPaid: true,
      order: txResult.order,
    });
  }

  return reply.send({
    ok: true,
    alreadyPaid: false,
    order: txResult.order,
    shortages: txResult.shortages,
  });
};

// ====== 4. FUNGSI BARU: VOID ORDER ======

export const voidOrder = async (req: FastifyRequest, reply: FastifyReply) => {
  const parsed = voidSchema.safeParse(req.body);

  if (!parsed.success) {
    return reply.code(400).send({ error: parsed.error.flatten() });
  }

  const { pin } = parsed.data;
  const id = Number((req.params as any).id);

  if (!Number.isFinite(id)) {
    return reply.code(400).send({ error: "Invalid id" });
  }

  // Validasi PIN Manager (Bisa diatur di file .env nantinya)
  const MANAGER_PIN = process.env.MANAGER_PIN || "123456";
  if (pin !== MANAGER_PIN) {
    return reply.code(403).send({ error: "PIN Manager Salah. Otorisasi VOID ditolak." });
  }

  try {
    const txResult = await prisma.$transaction(async (tx) => {
      // 1. Kunci Order dan pastikan bisa di-VOID
      await tx.$executeRawUnsafe(
        `SELECT id FROM "Order" WHERE id = ${id} FOR UPDATE`
      );

      const lockedOrder = await tx.order.findUnique({ where: { id } });

      if (!lockedOrder) return { kind: "NOT_FOUND" as const };
      if (lockedOrder.paymentStatus === "VOID") return { kind: "ALREADY_VOID" as const };

      // 2. Kembalikan Stok (Reverse StockMovement)
      // Kita cari semua riwayat pengurangan stok untuk order ini
      const movements = await tx.stockMovement.findMany({ where: { orderId: id } });

      for (const mov of movements) {
        // Karena waktu penjualan nilainya negatif (contoh: -2), kita buat absolut (positif 2) untuk mengembalikan stok.
        const amountToReturn = Math.abs(mov.qtyChange);

        await tx.ingredient.update({
          where: { id: mov.ingredientId },
          data: { stock: { increment: amountToReturn } },
        });

        // Catat riwayat pengembalian di StockMovement
        await tx.stockMovement.create({
          data: {
            ingredientId: mov.ingredientId,
            qtyChange: amountToReturn,
            reason: "RESTOCK",
            orderId: id,
          },
        });
      }

      // 3. Update Status Order
      const voidedOrder = await tx.order.update({
        where: { id },
        data: { paymentStatus: "VOID" },
      });

      return { kind: "SUCCESS" as const, order: voidedOrder };
    });

    if (txResult.kind === "NOT_FOUND") return reply.code(404).send({ error: "Order tidak ditemukan." });
    if (txResult.kind === "ALREADY_VOID") return reply.code(400).send({ error: "Order ini sudah pernah di-VOID." });

    return reply.send({
      ok: true,
      message: "Transaksi berhasil di-VOID. Stok bahan baku telah dikembalikan ke sistem.",
      order: txResult.order
    });
  } catch (error: any) {
    return reply.code(500).send({ error: error.message });
  }
};