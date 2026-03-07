import Fastify from "fastify";
import cors from "@fastify/cors";
import { z } from "zod";
import { prisma } from "./prisma";
import { loginUser } from "./controllers/authController";
import { verifyToken } from './middleware/authMiddleware';
import { createMenu, getAllMenus, updateMenu, getMenuById,deleteMenu } from './controllers/menuController';

const port = Number(process.env.PORT ?? 3001);
const webOrigin = process.env.WEB_ORIGIN ?? "http://localhost:3000";

const app = Fastify({ logger: true });
await app.register(cors, { origin: webOrigin, credentials: true });

app.get("/health", async () => ({ ok: true, ts: new Date().toISOString() }));
  
app.post("/api/auth/login", loginUser);

// --- MENUS ---
app.get("/api/menus", { preHandler: [verifyToken] }, getAllMenus);
app.post("/api/menus", { preHandler: [verifyToken] }, createMenu);
app.put("/api/menus/:id", { preHandler: [verifyToken] }, updateMenu); 
app.delete("/api/menus/:id", { preHandler: [verifyToken] }, deleteMenu);
app.get("/api/menus/:id", { preHandler: [verifyToken] }, getMenuById);

// --- ORDERS ---
const orderCreateSchema = z.object({
  userId: z.number().int().positive(),
  origin: z.enum(["COUNTER", "KITCHEN", "BAR"]),
  customerName: z.string().min(1).optional(),
  paymentMethod: z.enum(["CASH", "QRIS"]),
  items: z.array(z.object({
    menuId: z.number().int().positive(),
    qty: z.number().int().positive()
  })).min(1)
});

app.post("/orders", { preHandler: [verifyToken] }, async (req, reply) => {
  const parsed = orderCreateSchema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
  const { userId, origin, customerName, paymentMethod, items } = parsed.data;

  // Ambil harga menu (snapshot)
  const menus = await prisma.menu.findMany({
    where: { id: { in: items.map(i => i.menuId) } }
  });
  const menuMap = new Map(menus.map(m => [m.id, m]));
  if (menus.length !== new Set(items.map(i => i.menuId)).size) {
    return reply.code(400).send({ error: "Ada menu yang tidak ditemukan." });
  }

  const details = items.map(i => {
    const m = menuMap.get(i.menuId)!;
    const subtotal = m.price * i.qty;
    return { menuId: m.id, qty: i.qty, price: m.price, subtotal };
  });
  const totalPrice = details.reduce((a, b) => a + b.subtotal, 0);

  const order = await prisma.order.create({
    data: {
      userId,
      origin,
      customerName,
      paymentMethod,
      totalPrice,
      details: { create: details }
    },
    include: { details: true }
  });

  return order;
});

const paySchema = z.object({
  paymentMethod: z.enum(["CASH", "QRIS"]),
  overrideStock: z.boolean().optional().default(false),
  overrideNote: z.string().optional(),
});

// Bayar order -> kurangi stok sesuai resep
app.post("/orders/:id/pay", async (req, reply) => {
  const parsed = paySchema.safeParse(req.body);
  if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
  const { paymentMethod, overrideStock, overrideNote } = parsed.data;

  const id = Number((req.params as any).id);
  if (!Number.isFinite(id)) return reply.code(400).send({ error: "Invalid id" });

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      details: true
    }
  });
  if (!order) return reply.code(404).send({ error: "Order not found" });
  if (order.paymentStatus === "PAID") return reply.code(409).send({ error: "Order already PAID" });
  if (order.paymentStatus === "VOID") return reply.code(409).send({ error: "Order already VOID" });

  // Kumpulkan kebutuhan bahan dari semua detail + resep
  const menuIds = order.details.map(d => d.menuId);
  const recipes = await prisma.recipe.findMany({ where: { menuId: { in: menuIds } } });

  // totalNeeded[ingredientId] = sum(amountNeeded * qty)
  const qtyByMenu = new Map<number, number>();
  for (const d of order.details) qtyByMenu.set(d.menuId, (qtyByMenu.get(d.menuId) ?? 0) + d.qty);

  const totalNeeded = new Map<number, number>();
  for (const r of recipes) {
    const qty = qtyByMenu.get(r.menuId) ?? 0;
    const need = r.amountNeeded * qty;
    totalNeeded.set(r.ingredientId, (totalNeeded.get(r.ingredientId) ?? 0) + need);
  }

  const ingredientIds = [...totalNeeded.keys()];
  const ingredients = await prisma.ingredient.findMany({ where: { id: { in: ingredientIds } } });
  const ingMap = new Map(ingredients.map(i => [i.id, i]));

  // Validate cukup
  for (const [ingredientId, need] of totalNeeded.entries()) {
    const ing = ingMap.get(ingredientId);
    if (!ing) return reply.code(400).send({ error: `Ingredient ${ingredientId} not found` });
    if (ing.stock < need) {
      return reply.code(409).send({
        error: "STOCK_NOT_ENOUGH",
        ingredientId,
        ingredientName: ing.name,
        stock: ing.stock,
        need
      });
    }
  }

  // Transaction + row lock (pessimistic) via raw query for safety
  const result = await prisma.$transaction(async (tx) => {
    // lock ingredient rows
    if (ingredientIds.length) {
      await tx.$executeRawUnsafe(
        `SELECT id FROM "Ingredient" WHERE id IN (${ingredientIds.join(",")}) FOR UPDATE`
      );
    }

    // re-check after lock
    const lockedIngredients = await tx.ingredient.findMany({ where: { id: { in: ingredientIds } } });
    const lockedMap = new Map(lockedIngredients.map(i => [i.id, i]));
    for (const [ingredientId, need] of totalNeeded.entries()) {
      const ing = lockedMap.get(ingredientId)!;
      if (ing.stock < need) {
        throw Object.assign(new Error("STOCK_NOT_ENOUGH"), { ingredientId, need, stock: ing.stock, name: ing.name });
      }
    }

    // update order -> PAID
    const paidOrder = await tx.order.update({
      where: { id: order.id },
      data: { paymentStatus: "PAID",
          paymentMethod,
          stockOverride: overrideStock,
          overrideNote,
          paidAt: new Date(),
       },
    });

    // apply stock updates + movements
    for (const [ingredientId, need] of totalNeeded.entries()) {
      await tx.ingredient.update({
        where: { id: ingredientId },
        data: { stock: { decrement: need } }
      });
      await tx.stockMovement.create({
        data: {
          ingredientId,
          qtyChange: -need,
          reason: overrideStock ? "SALE_OVERRIDE" : "SALE",
          orderId: order.id
        }
      });
    }

    return paidOrder;
  });

  return { ok: true, order: result };
});

// Seed sederhana (menu+bahan+resep) untuk demo
app.post("/dev/seed", async (_req, reply) => {
  if (process.env.NODE_ENV === "production") return reply.code(403).send({ error: "Forbidden" });

  const [u] = await prisma.user.findMany({ take: 1 });
  const user = u ?? await prisma.user.create({ data: { name: "Kasir 1", username: "kasirdemo", password: "dummy123", role: "PEGAWAI", location: "COUNTER" } });

  const kopi = await prisma.menu.upsert({
    where: { id: 1 },
    update: { name: "Es Kopi Susu", price: 18000 },
    create: { id: 1, name: "Es Kopi Susu", price: 18000 }
  });

  const teh = await prisma.menu.upsert({
    where: {id: 2 },
    update: {name: "Es Teh Manis", price: 10000 },
    create: {id:2, name: "Es Teh Manis", price: 10000}
  });

  const rotibakar = await prisma.menu.upsert({
    where: {id: 3},
    update: {name: "Roti Bakar",  price: 15000},
    create: {id:3, name: "Roti Bakar", price: 15000}
  });

  const gula = await prisma.ingredient.upsert({
    where: { id: 1 },
    update: { name: "Gula", stock: 1000, unit: "gram" },
    create: { id: 1, name: "Gula", stock: 1000, unit: "gram" }
  });
  const susu = await prisma.ingredient.upsert({
    where: { id: 2 },
    update: { name: "Susu", stock: 2000, unit: "ml" },
    create: { id: 2, name: "Susu", stock: 2000, unit: "ml" }
  });

  const roti = await prisma.ingredient.upsert({
    where: { id: 3 },
    update: {name: "Roti", stock: 500, unit: "buah"},
    create: {id: 3, name: "Roti", stock: 500, unit: "buah"}
  });

  await prisma.recipe.upsert({
    where: { menuId_ingredientId: { menuId: kopi.id, ingredientId: gula.id } },
    update: { amountNeeded: 20 },
    create: { menuId: kopi.id, ingredientId: gula.id, amountNeeded: 20 }
  });
  await prisma.recipe.upsert({
    where: { menuId_ingredientId: { menuId: kopi.id, ingredientId: susu.id } },
    update: { amountNeeded: 150 },
    create: { menuId: kopi.id, ingredientId: susu.id, amountNeeded: 150 }
  });

  await prisma.recipe.upsert({
    where: { menuId_ingredientId: { menuId: teh.id, ingredientId: gula.id}},
    update: {amountNeeded: 15},
    create: {menuId: teh.id, ingredientId: gula.id, amountNeeded: 15}
  });

  await prisma.recipe.upsert({
    where: {menuId_ingredientId: {menuId: rotibakar.id, ingredientId: roti.id}},
    update: {amountNeeded: 2},
    create: {menuId: rotibakar.id, ingredientId: roti.id, amountNeeded:2}
  })

  await prisma.recipe.upsert({
    where: {menuId_ingredientId: {menuId: rotibakar.id, ingredientId: susu.id}},
    update: {amountNeeded: 10},
    create: {menuId: rotibakar.id, ingredientId: susu.id, amountNeeded: 10}
  })

  return { ok: true, userId: user.id };
});

app.listen({ port, host: "0.0.0.0" });
