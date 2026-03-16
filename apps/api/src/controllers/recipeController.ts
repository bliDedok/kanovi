import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { prisma } from "../prisma";

const isOwner = (req: FastifyRequest) => {
  const user = (req as any).user;
  return user?.role === "OWNER";
};

const recipeReplaceSchema = z.object({
  items: z.array(
    z.object({
      ingredientId: z.number().int().positive(),
      amountNeeded: z.number().int().positive(),
    })
  ),
});

export const getMenuRecipe = async (req: FastifyRequest, reply: FastifyReply) => {
  if (!isOwner(req)) {
    return reply.code(403).send({ message: "Akses ditolak. Hanya Owner." });
  }

  const { id } = req.params as { id: string };
  const menuId = Number(id);

  if (!Number.isFinite(menuId)) {
    return reply.code(400).send({ message: "ID menu tidak valid." });
  }

  try {
    const menu = await prisma.menu.findUnique({
      where: { id: menuId },
      include: {
        recipes: {
          include: {
            ingredient: true,
          },
          orderBy: { ingredientId: "asc" },
        },
      },
    });

    if (!menu) {
      return reply.code(404).send({ message: "Menu tidak ditemukan." });
    }

    return reply.code(200).send({
      menu: {
        id: menu.id,
        name: menu.name,
        price: menu.price,
      },
      items: menu.recipes.map((r) => ({
        id: r.id,
        ingredientId: r.ingredientId,
        ingredientName: r.ingredient.name,
        unit: r.ingredient.unit,
        amountNeeded: r.amountNeeded,
      })),
    });
  } catch (error) {
    console.error(error);
    return reply.code(500).send({ message: "Gagal mengambil recipe menu." });
  }
};

export const replaceMenuRecipe = async (req: FastifyRequest, reply: FastifyReply) => {
  if (!isOwner(req)) {
    return reply.code(403).send({ message: "Akses ditolak. Hanya Owner." });
  }

  const { id } = req.params as { id: string };
  const menuId = Number(id);

  if (!Number.isFinite(menuId)) {
    return reply.code(400).send({ message: "ID menu tidak valid." });
  }

  const parsed = recipeReplaceSchema.safeParse(req.body);
  if (!parsed.success) {
    return reply.code(400).send({ error: parsed.error.flatten() });
  }

  const { items } = parsed.data;

  const seen = new Set<number>();
  for (const item of items) {
    if (seen.has(item.ingredientId)) {
      return reply.code(400).send({
        message: `ingredientId ${item.ingredientId} duplikat dalam payload.`,
      });
    }
    seen.add(item.ingredientId);
  }

  try {
    const menu = await prisma.menu.findUnique({
      where: { id: menuId },
    });

    if (!menu) {
      return reply.code(404).send({ message: "Menu tidak ditemukan." });
    }

    const ingredientIds = items.map((i) => i.ingredientId);

    const ingredients = ingredientIds.length
      ? await prisma.ingredient.findMany({
          where: { id: { in: ingredientIds } },
        })
      : [];

    if (ingredients.length !== ingredientIds.length) {
      const foundIds = new Set(ingredients.map((i) => i.id));
      const missingIds = ingredientIds.filter((id) => !foundIds.has(id));

      return reply.code(400).send({
        message: "Ada ingredient yang tidak ditemukan.",
        missingIngredientIds: missingIds,
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.recipe.deleteMany({
        where: { menuId },
      });

      if (items.length > 0) {
        await tx.recipe.createMany({
          data: items.map((item) => ({
            menuId,
            ingredientId: item.ingredientId,
            amountNeeded: item.amountNeeded,
          })),
        });
      }
    });

    const updated = await prisma.menu.findUnique({
      where: { id: menuId },
      include: {
        recipes: {
          include: {
            ingredient: true,
          },
          orderBy: { ingredientId: "asc" },
        },
      },
    });

    return reply.code(200).send({
      message: "Recipe berhasil disimpan.",
      menu: {
        id: updated!.id,
        name: updated!.name,
        price: updated!.price,
      },
      items: updated!.recipes.map((r) => ({
        id: r.id,
        ingredientId: r.ingredientId,
        ingredientName: r.ingredient.name,
        unit: r.ingredient.unit,
        amountNeeded: r.amountNeeded,
      })),
    });
  } catch (error) {
    console.error(error);
    return reply.code(500).send({ message: "Gagal menyimpan recipe menu." });
  }
};