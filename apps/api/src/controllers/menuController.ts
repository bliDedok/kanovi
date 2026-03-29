import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../prisma";

const isOwner = (req: FastifyRequest) => {
  const user = (req as any).user;
  return user && user.role === "OWNER";
};

// 1. CREATE MENU
export const createMenu = async (req: FastifyRequest, reply: FastifyReply) => {
  if (!isOwner(req)) {
    return reply.code(403).send({ message: "Akses ditolak. Hanya Owner." });
  }

  const { name, price, categoryId, prepStation } = req.body as {
    name: string;
    price: number;
    categoryId?: number | null;
    prepStation?: "KITCHEN" | "BAR";
  };

  if (!name || price === undefined || price === null) {
    return reply.code(400).send({
      message: "Nama dan harga menu wajib diisi.",
    });
  }

  if (categoryId !== undefined && categoryId !== null) {
    const category = await prisma.category.findUnique({
      where: { id: Number(categoryId) },
    });

    if (!category) {
      return reply.code(400).send({
        message: "Kategori tidak ditemukan.",
      });
    }
  }

  try {
    const newMenu = await prisma.menu.create({
      data: {
        name,
        price: Number(price),
        categoryId: categoryId ?? null,
        prepStation: prepStation ?? "KITCHEN",
      },
      include: {
        category: true,
      },
    });

    return reply.code(201).send({
      message: "Menu berhasil ditambahkan",
      data: newMenu,
    });
  } catch (error) {
    console.error(error);
    return reply.code(500).send({ message: "Gagal menyimpan menu" });
  }
};

// 2. GET ALL MENUS
export const getAllMenus = async (_req: FastifyRequest, reply: FastifyReply) => {
  try {
    const menus = await prisma.menu.findMany({
      include: {
        category: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return reply.code(200).send(menus);
  } catch (error) {
    return reply.code(500).send({ message: "Gagal mengambil data menu" });
  }
};

// 3. GET MENU BY ID
export const getMenuById = async (req: FastifyRequest, reply: FastifyReply) => {
  const { id } = req.params as { id: string };

  try {
    const menu = await prisma.menu.findUnique({
      where: { id: Number(id) },
      include: {
        category: true,
      },
    });

    if (!menu) {
      return reply.code(404).send({ message: "Menu tidak ditemukan" });
    }

    return reply.code(200).send(menu);
  } catch (error) {
    return reply.code(500).send({ message: "Gagal mengambil detail menu" });
  }
};

// 4. UPDATE MENU
export const updateMenu = async (req: FastifyRequest, reply: FastifyReply) => {
  if (!isOwner(req)) {
    return reply.code(403).send({ message: "Akses ditolak. Hanya Owner." });
  }

  const { id } = req.params as { id: string };
  const { name, price, categoryId, prepStation } = req.body as {
    name?: string;
    price?: number;
    categoryId?: number | null;
    prepStation?: "KITCHEN" | "BAR";
  };

  if (categoryId !== undefined && categoryId !== null) {
    const category = await prisma.category.findUnique({
      where: { id: Number(categoryId) },
    });

    if (!category) {
      return reply.code(400).send({
        message: "Kategori tidak ditemukan.",
      });
    }
  }

  try {
    const updatedMenu = await prisma.menu.update({
      where: { id: Number(id) },
      data: {
        ...(name !== undefined && { name }),
        ...(price !== undefined && { price: Number(price) }),
        ...(categoryId !== undefined && { categoryId }),
        ...(prepStation !== undefined && { prepStation }),
      },
      include: {
        category: true,
      },
    });

    return reply.code(200).send({
      message: "Menu berhasil diupdate",
      data: updatedMenu,
    });
  } catch (error) {
    return reply
      .code(500)
      .send({ message: "Gagal mengupdate menu. Pastikan ID benar." });
  }
};

// 5. DELETE MENU
export const deleteMenu = async (req: FastifyRequest, reply: FastifyReply) => {
  if (!isOwner(req)) {
    return reply.code(403).send({ message: "Akses ditolak. Hanya Owner." });
  }

  const { id } = req.params as { id: string };

  try {
    await prisma.menu.delete({
      where: { id: Number(id) },
    });

    return reply.code(200).send({
      message: "Menu berhasil dihapus",
    });
  } catch (error) {
    return reply
      .code(500)
      .send({ message: "Gagal menghapus menu. Pastikan ID benar." });
  }
};