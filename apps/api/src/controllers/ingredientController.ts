import { FastifyReply, FastifyRequest } from "fastify";
import { StockReason } from "@prisma/client";
import { z } from "zod";
import { inventoryService } from "../services/inventoryService";

const createIngredientSchema = z.object({
  name: z.string().trim().min(1, "Nama wajib diisi"),
  stock: z.coerce.number().int().min(0, "Stock tidak boleh negatif"),
  unit: z.string().trim().min(1, "Unit wajib diisi"),
  minStock: z.coerce
    .number()
    .int()
    .min(0, "minStock tidak boleh negatif")
    .default(0),
});

const updateIngredientSchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    stock: z.coerce.number().int().min(0).optional(),
    unit: z.string().trim().min(1).optional(),
    minStock: z.coerce.number().int().min(0).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Minimal satu field harus diisi",
  });

const adjustIngredientSchema = z
  .object({
    qtyChange: z.coerce.number().int().refine((value) => value !== 0, {
      message: "qtyChange tidak boleh 0",
    }),
    reason: z.nativeEnum(StockReason),
  })
  .superRefine((data, ctx) => {
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
    reply.code(403).send({
      message: "Akses ditolak. Hanya OWNER.",
    });

    return true;
  }

  return false;
}

export async function getAllIngredients(
  _req: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const ingredients = await inventoryService.getAllIngredients();

    return reply.code(200).send({
      ok: true,
      data: ingredients,
    });
  } catch (error) {
    console.error(error);

    return reply.code(500).send({
      message: "Gagal mengambil data ingredient",
    });
  }
}

export async function getLowStockIngredients(
  _req: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const ingredients = await inventoryService.getLowStockIngredients();

    return reply.code(200).send({
      ok: true,
      data: ingredients,
    });
  } catch (error) {
    console.error(error);

    return reply.code(500).send({
      message: "Gagal mengambil low-stock ingredient",
    });
  }
}

export async function createIngredient(
  req: FastifyRequest,
  reply: FastifyReply
) {
  if (forbidIfNotOwner(req, reply)) return;

  const parsed = createIngredientSchema.safeParse(req.body);

  if (!parsed.success) {
    return reply.code(400).send({
      error: parsed.error.flatten(),
    });
  }

  try {
    const result = await inventoryService.createIngredient(parsed.data);

    if (result.kind === "DUPLICATE_NAME") {
      return reply.code(409).send({
        message: "Ingredient dengan nama itu sudah ada",
      });
    }

    return reply.code(201).send({
      ok: true,
      message: "Ingredient berhasil ditambahkan",
      data: result.ingredient,
    });
    } catch (error) {
    console.error("CREATE_INGREDIENT_ERROR:", error);

    return reply.code(500).send({
      message: "Gagal menyimpan ingredient",
      detail: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function updateIngredient(
  req: FastifyRequest,
  reply: FastifyReply
) {
  if (forbidIfNotOwner(req, reply)) return;

  const id = Number((req.params as { id: string }).id);

  if (!Number.isFinite(id)) {
    return reply.code(400).send({
      message: "ID tidak valid",
    });
  }

  const parsed = updateIngredientSchema.safeParse(req.body);

  if (!parsed.success) {
    return reply.code(400).send({
      error: parsed.error.flatten(),
    });
  }

  try {
    const result = await inventoryService.updateIngredient({
      id,
      ...parsed.data,
    });

    if (result.kind === "NOT_FOUND") {
      return reply.code(404).send({
        message: "Ingredient tidak ditemukan",
      });
    }

    return reply.code(200).send({
      ok: true,
      message: "Ingredient berhasil diupdate",
      data: result.ingredient,
    });
  } catch (error) {
    console.error(error);

    return reply.code(500).send({
      message: "Gagal mengupdate ingredient",
    });
  }
}

export async function adjustIngredientStock(
  req: FastifyRequest,
  reply: FastifyReply
) {
  if (forbidIfNotOwner(req, reply)) return;

  const id = Number((req.params as { id: string }).id);

  if (!Number.isFinite(id)) {
    return reply.code(400).send({
      message: "ID tidak valid",
    });
  }

  const parsed = adjustIngredientSchema.safeParse(req.body);

  if (!parsed.success) {
    return reply.code(400).send({
      error: parsed.error.flatten(),
    });
  }

  try {
    const result = await inventoryService.adjustIngredientStock({
      ingredientId: id,
      ...parsed.data,
    });

    if (result.kind === "NOT_FOUND") {
      return reply.code(404).send({
        message: "Ingredient tidak ditemukan",
      });
    }

    if (result.kind === "NEGATIVE_STOCK") {
      return reply.code(409).send({
        message: "Stock tidak cukup untuk adjustment",
        currentStock: result.currentStock,
        qtyChange: result.qtyChange,
      });
    }

    return reply.code(200).send({
      ok: true,
      message: "Stok berhasil diadjust",
      data: {
        ingredient: {
          ...result.updatedIngredient,
          isLowStock:
            result.updatedIngredient.stock <= result.updatedIngredient.minStock,
        },
        movement: result.movement,
      },
    });
  } catch (error) {
    console.error(error);

    return reply.code(500).send({
      message: "Gagal mengadjust stok",
    });
  }
}

export async function getIngredientMovements(
  req: FastifyRequest,
  reply: FastifyReply
) {
  const id = Number((req.params as { id: string }).id);

  if (!Number.isFinite(id)) {
    return reply.code(400).send({
      message: "ID tidak valid",
    });
  }

  try {
    const result = await inventoryService.getIngredientMovements(id);

    if (result.kind === "NOT_FOUND") {
      return reply.code(404).send({
        message: "Ingredient tidak ditemukan",
      });
    }

    return reply.send({
      ok: true,
      data: result.movements,
    });
  } catch (error) {
    console.error(error);

    return reply.code(500).send({
      message: "Gagal mengambil movement ingredient",
    });
  }
}