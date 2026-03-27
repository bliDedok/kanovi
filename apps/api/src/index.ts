import Fastify from "fastify";
import cors from "@fastify/cors";
import { z } from "zod";
import { prisma } from "./prisma";
import { loginUser } from "./controllers/authController";
import { verifyToken } from './middleware/authMiddleware';
import { createMenu, getAllMenus, updateMenu, getMenuById,deleteMenu } from './controllers/menuController';
import {getAllIngredients, getLowStockIngredients, createIngredient, updateIngredient, adjustIngredientStock, } from "./controllers/ingredientController";
import { getMenuRecipe, replaceMenuRecipe } from "./controllers/recipeController";
import { getAllCategories,createCategory, updateCategory, deleteCategory, } from "./controllers/categoryController";
import { getActiveQueue, updateOrderStatus, getOrderHistory } from "./controllers/queueController";



const port = Number(process.env.PORT ?? 3001);
const app = Fastify({ logger: true });


app.register(cors, {
  origin: "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
});

app.get("/health", async () => ({ ok: true, ts: new Date().toISOString() }));
app.post("/api/auth/login", loginUser);

// --- MENUS ---
app.get("/api/menus", { preHandler: [verifyToken] }, getAllMenus);
app.post("/api/menus", { preHandler: [verifyToken] }, createMenu);
app.patch("/api/menus/:id", { preHandler: [verifyToken] }, updateMenu);
app.delete("/api/menus/:id", { preHandler: [verifyToken] }, deleteMenu);
app.get("/api/menus/:id", { preHandler: [verifyToken] }, getMenuById);

// --- INGREDIENTS ---
app.get("/api/ingredients", { preHandler: [verifyToken] }, getAllIngredients);
app.get("/api/ingredients/low-stock", { preHandler: [verifyToken] }, getLowStockIngredients);
app.post("/api/ingredients", { preHandler: [verifyToken] }, createIngredient);
app.patch("/api/ingredients/:id", { preHandler: [verifyToken] }, updateIngredient);
app.post("/api/ingredients/:id/adjust", { preHandler: [verifyToken] }, adjustIngredientStock);

// --- CATEGORIES ---
app.get("/categories", { preHandler: [verifyToken] }, getAllCategories);
app.post("/categories", { preHandler: [verifyToken] }, createCategory);
app.put("/categories/:id", { preHandler: [verifyToken] }, updateCategory);
app.delete("/categories/:id", { preHandler: [verifyToken] }, deleteCategory);

// --- RECIPE PER MENU ---
app.get("/api/menus/:id/recipe", { preHandler: [verifyToken] }, getMenuRecipe);
app.put("/api/menus/:id/recipe", { preHandler: [verifyToken] }, replaceMenuRecipe);

// --- ORDERS ---
// ====== 1. BAGIAN SCHEMA VALIDASI (ZOD) ======
const orderItemSchema = z.object({
  menuId: z.number().int().positive(),
  qty: z.number().int().positive(),
});

// --- QUEUE STATION (KITCHEN/BAR) ---
app.get("/api/queue", { preHandler: [verifyToken] }, getActiveQueue);
app.patch("/api/queue/:id/status", { preHandler: [verifyToken] }, updateOrderStatus);
app.get("/api/orders/history", { preHandler: [verifyToken] }, getOrderHistory);

const orderCreateSchema = z.object({
  // userId: z.number().int().positive(), <--- DIHAPUS: Kita tidak lagi menerima userId dari frontend
  origin: z.enum(["COUNTER", "KITCHEN", "BAR"]),
  customerName: z.string().trim().min(1).optional(),
  items: z.array(orderItemSchema).min(1),
});

const paySchema = z.object({
  paymentMethod: z.enum(["CASH", "QRIS"]),
  overrideStock: z.boolean().optional().default(false),
  overrideNote: z.string().trim().optional(),
});

// ====== 2. BAGIAN HELPER FUNGSI STOK ======
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

// ====== 3. BAGIAN CREATE ORDER (HARDENING USER ID) ======
app.post("/api/orders", { preHandler: [verifyToken] }, async (req, reply) => {
  const parsed = orderCreateSchema.safeParse(req.body);

  if (!parsed.success) {
    return reply.code(400).send({ error: parsed.error.flatten() });
  }


  const userId = req.user?.id || req.user?.userId; 
  
  if (!userId) {
    return reply.code(401).send({ error: "Unauthorized: User ID tidak ditemukan dalam token." });
  }

  const { origin, customerName, items } = parsed.data;

  const menus = await prisma.menu.findMany({
    where: { id: { in: items.map((i) => i.menuId) } },
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
    };
  });

  const totalPrice = details.reduce((sum, item) => sum + item.subtotal, 0);

  const order = await prisma.order.create({
    data: {
      userId: Number(userId), // Gunakan userId dari token
      origin,
      customerName,
      totalPrice,
      paymentStatus: "UNPAID",
      details: {
        create: details,
      },
    },
    include: { details: true },
  });

  return order;
});

// ====== 4. BAGIAN STOCK CHECK ======
app.get("/api/orders/:id/stock-check", { preHandler: [verifyToken] }, async (req, reply) => {
  const id = Number((req.params as any).id);

  if (!Number.isFinite(id)) {
    return reply.code(400).send({ error: "Invalid id" });
  }

  const summary = await getOrderStockSummary(id);

  if (!summary) {
    return reply.code(404).send({ error: "Order not found" });
  }

  return {
    ok: true,
    orderId: summary.order.id,
    hasShortage: summary.shortages.length > 0,
    requirements: summary.requirements,
    shortages: summary.shortages,
  };
});

// ====== 5. BAGIAN PAYMENT & QUEUE STATION ======
app.post("/api/orders/:id/pay", { preHandler: [verifyToken] }, async (req, reply) => {
  const parsed = paySchema.safeParse(req.body);

  if (!parsed.success) {
    return reply.code(400).send({ error: parsed.error.flatten() });
  }

  const { paymentMethod, overrideStock, overrideNote } = parsed.data;
  const id = Number((req.params as any).id);

  // Ambil ID Kasir dari Token untuk dicatat sebagai "Actor" jika terjadi override
  const actorId = req.user?.id || req.user?.userId;

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

    // UPDATE ORDER: Set Payment PAID dan ubah Status menjadi IN_QUEUE
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
    return {
      ok: true,
      alreadyPaid: true,
      order: txResult.order,
    };
  }

  return {
    ok: true,
    alreadyPaid: false,
    order: txResult.order,
    shortages: txResult.shortages,
  };
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
  update: { name: "Gula", stock: 1000, unit: "gram", minStock: 200 },
  create: { id: 1, name: "Gula", stock: 1000, unit: "gram", minStock: 200 },
});

const susu = await prisma.ingredient.upsert({
  where: { id: 2 },
  update: { name: "Susu", stock: 2000, unit: "ml", minStock: 300 },
  create: { id: 2, name: "Susu", stock: 2000, unit: "ml", minStock: 300 },
});

const roti = await prisma.ingredient.upsert({
  where: { id: 3 },
  update: { name: "Roti", stock: 500, unit: "buah", minStock: 50 },
  create: { id: 3, name: "Roti", stock: 500, unit: "buah", minStock: 50 },
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
