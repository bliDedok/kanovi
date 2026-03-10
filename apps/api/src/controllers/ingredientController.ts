import { FastifyReply, FastifyRequest } from "fastify";
import { StockReason } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../prisma";

const createIngredientSchema = z.object({
  name: z.string().trim().min(1, "Nama wajib diisi"),
  stock: z.number().int().min(0, "Stock tidak boleh negatif"),
  unit: z.string().trim().min(1, "Unit wajib diisi"),
  minStock: z.number().int().min(0, "minStock tidak boleh negatif").default(0),
});

const updateIngredientSchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    stock: z.number().int().min(0).optional(),
    unit: z.string().trim().min(1).optional(),
    minStock: z.number().int().min(0).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Minimal satu field harus diisi",
  });

const adjustIngredientSchema = z
  .object({
    qtyChange: z.number().int().refine((v) => v !== 0, {
      message: "qtyChange tidak boleh 0",
    }),
    reason: z.nativeEnum(StockReason),
  })
  .superRefine((data, ctx) => {
    // reason SALE dan SALE_OVERRIDE biarkan khusus dari flow pembayaran order
    if (data.reason === "SALE" || data.reason === "SALE_OVERRIDE") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Reason ini tidak boleh dipakai untuk adjustment manual",
        path: ["reason"],
      });
    }

    if (data.reason === "RESTOCK" && data.qtyChange < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "RESTOCK harus bernilai positif",
        path: ["qtyChange"],
      });
    }

    if (data.reason === "SPOIL" && data.qtyChange > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "SPOIL harus bernilai negatif",
        path: ["qtyChange"],
      });
    }
  });

function isOwner(req: FastifyRequest) {
  const user = (req as any).user;
  return user?.role === "OWNER";
}

function forbidIfNotOwner(req: FastifyRequest, reply: FastifyReply) {
  if (!isOwner(req)) {
    reply.code(403).send({ message: "Akses ditolak. Hanya OWNER." });
    return true;
  }
  return false;
}

export async function getAllIngredients(_req: FastifyRequest, reply: FastifyReply) {
  try {
    const ingredients = await prisma.ingredient.findMany({
      orderBy: { id: "asc" },
    });

    return reply.code(200).send(
      ingredients.map((item) => ({
        ...item,
        isLowStock: item.stock <= item.minStock,
      }))
    );
  } catch (error) {
    console.error(error);
    return reply.code(500).send({ message: "Gagal mengambil data ingredient" });
  }
}

export async function getLowStockIngredients(_req: FastifyRequest, reply: FastifyReply) {
  try {
    const ingredients = await prisma.ingredient.findMany({
      where: {
        stock: {
          lte: prisma.ingredient.fields.minStock,
        },
      },
      orderBy: [{ stock: "asc" }, { id: "asc" }],
    });

    return reply.code(200).send(
      ingredients.map((item) => ({
        ...item,
        isLowStock: true,
      }))
    );
  } catch (error) {
    console.error(error);
    return reply.code(500).send({ message: "Gagal mengambil low-stock ingredient" });
  }
}

export async function createIngredient(req: FastifyRequest, reply: FastifyReply) {
  if (forbidIfNotOwner(req, reply)) return;

  const parsed = createIngredientSchema.safeParse(req.body);
  if (!parsed.success) {
    return reply.code(400).send({ error: parsed.error.flatten() });
  }

  const { name, stock, unit, minStock } = parsed.data;

  try {
    const existing = await prisma.ingredient.findFirst({
      where: {
        name: {
          equals: name,
          mode: "insensitive",
        },
      },
    });

    if (existing) {
      return reply.code(409).send({ message: "Ingredient dengan nama itu sudah ada" });
    }

    const ingredient = await prisma.ingredient.create({
      data: { name, stock, unit, minStock },
    });

    return reply.code(201).send({
      message: "Ingredient berhasil ditambahkan",
      data: {
        ...ingredient,
        isLowStock: ingredient.stock <= ingredient.minStock,
      },
    });
  } catch (error) {
    console.error(error);
    return reply.code(500).send({ message: "Gagal menyimpan ingredient" });
  }
}

export async function updateIngredient(req: FastifyRequest, reply: FastifyReply) {
  if (forbidIfNotOwner(req, reply)) return;

  const id = Number((req.params as { id: string }).id);
  if (!Number.isFinite(id)) {
    return reply.code(400).send({ message: "ID tidak valid" });
  }

  const parsed = updateIngredientSchema.safeParse(req.body);
  if (!parsed.success) {
    return reply.code(400).send({ error: parsed.error.flatten() });
  }

  try {
    const existing = await prisma.ingredient.findUnique({ where: { id } });
    if (!existing) {
      return reply.code(404).send({ message: "Ingredient tidak ditemukan" });
    }

    const updated = await prisma.ingredient.update({
      where: { id },
      data: parsed.data,
    });

    return reply.code(200).send({
      message: "Ingredient berhasil diupdate",
      data: {
        ...updated,
        isLowStock: updated.stock <= updated.minStock,
      },
    });
  } catch (error) {
    console.error(error);
    return reply.code(500).send({ message: "Gagal mengupdate ingredient" });
  }
}

export async function adjustIngredientStock(req: FastifyRequest, reply: FastifyReply) {
  if (forbidIfNotOwner(req, reply)) return;

  const id = Number((req.params as { id: string }).id);
  if (!Number.isFinite(id)) {
    return reply.code(400).send({ message: "ID tidak valid" });
  }

  const parsed = adjustIngredientSchema.safeParse(req.body);
  if (!parsed.success) {
    return reply.code(400).send({ error: parsed.error.flatten() });
  }

  const { qtyChange, reason } = parsed.data;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const ingredient = await tx.ingredient.findUnique({ where: { id } });

      if (!ingredient) {
        throw Object.assign(new Error("NOT_FOUND"), { statusCode: 404 });
      }

      const nextStock = ingredient.stock + qtyChange;
      if (nextStock < 0) {
        throw Object.assign(new Error("NEGATIVE_STOCK"), {
          statusCode: 409,
          currentStock: ingredient.stock,
          qtyChange,
        });
      }

      const updatedIngredient = await tx.ingredient.update({
        where: { id },
        data: {
          stock: nextStock,
        },
      });

      const movement = await tx.stockMovement.create({
        data: {
          ingredientId: id,
          qtyChange,
          reason,
        },
      });

      return { updatedIngredient, movement };
    });

    return reply.code(200).send({
      message: "Stok berhasil diadjust",
      data: {
        ingredient: {
          ...result.updatedIngredient,
          isLowStock: result.updatedIngredient.stock <= result.updatedIngredient.minStock,
        },
        movement: result.movement,
      },
    });
  } catch (error: any) {
    if (error?.statusCode === 404) {
      return reply.code(404).send({ message: "Ingredient tidak ditemukan" });
    }

    if (error?.statusCode === 409) {
      return reply.code(409).send({
        message: "Stock tidak cukup untuk adjustment",
        currentStock: error.currentStock,
        qtyChange: error.qtyChange,
      });
    }

    console.error(error);
    return reply.code(500).send({ message: "Gagal mengadjust stok" });
  }
}