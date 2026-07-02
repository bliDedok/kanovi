import { FastifyRequest, FastifyReply } from "fastify";
import { menuService } from "../services/menuService";

const isOwner = (req: FastifyRequest) => {
  const user = (req as any).user;

  return user && user.role === "OWNER";
};

function forbidIfNotOwner(req: FastifyRequest, reply: FastifyReply) {
  if (!isOwner(req)) {
    reply.code(403).send({
      message: "Akses ditolak. Hanya Owner.",
    });

    return true;
  }

  return false;
}

export const createMenu = async (req: FastifyRequest, reply: FastifyReply) => {
  if (forbidIfNotOwner(req, reply)) return;

  const { name, price, categoryId, prepStation, isAvailable } = req.body as {
    name: string;
    price: number;
    categoryId?: number | null;
    prepStation?: "KITCHEN" | "BAR";
    isAvailable?: boolean;
  };

  try {
    const result = await menuService.createMenu({
      name,
      price: Number(price),
      categoryId:
        categoryId !== undefined && categoryId !== null
          ? Number(categoryId)
          : null,
      prepStation,
      isAvailable,
    });

    if (result.kind === "VALIDATION_ERROR") {
      return reply.code(400).send({
        message: result.message,
      });
    }

    if (result.kind === "CATEGORY_NOT_FOUND") {
      return reply.code(400).send({
        message: "Kategori tidak ditemukan.",
      });
    }

    return reply.code(201).send({
      message: "Menu berhasil ditambahkan",
      data: result.menu,
    });
  } catch (error) {
    console.error(error);

    return reply.code(500).send({
      message: "Gagal menyimpan menu",
    });
  }
};

export const getAllMenus = async (
  _req: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const menus = await menuService.getAllMenus();

    return reply.code(200).send(menus);
  } catch (error) {
    console.error("Gagal mengambil data menu:", error);

    return reply.code(500).send({
      message: "Gagal mengambil data menu",
    });
  }
};

export const getMenuById = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  const { id } = req.params as { id: string };
  const menuId = Number(id);

  if (!Number.isFinite(menuId)) {
    return reply.code(400).send({
      message: "ID menu tidak valid.",
    });
  }

  try {
    const result = await menuService.getMenuById(menuId);

    if (result.kind === "NOT_FOUND") {
      return reply.code(404).send({
        message: "Menu tidak ditemukan",
      });
    }

    return reply.code(200).send(result.menu);
  } catch {
    return reply.code(500).send({
      message: "Gagal mengambil detail menu",
    });
  }
};

export const updateMenu = async (req: FastifyRequest, reply: FastifyReply) => {
  if (forbidIfNotOwner(req, reply)) return;

  const { id } = req.params as { id: string };
  const menuId = Number(id);

  const { name, price, categoryId, prepStation, isAvailable } = req.body as {
    name?: string;
    price?: number;
    categoryId?: number | null;
    prepStation?: "KITCHEN" | "BAR";
    isAvailable?: boolean;
  };

  const result = await menuService.updateMenu({
    id: menuId,
    name,
    price: price !== undefined ? Number(price) : undefined,
    categoryId:
      categoryId !== undefined && categoryId !== null
        ? Number(categoryId)
        : categoryId,
    prepStation,
    isAvailable,
  });

  if (result.kind === "INVALID_ID") {
    return reply.code(400).send({
      message: "ID menu tidak valid.",
    });
  }

  if (result.kind === "VALIDATION_ERROR") {
    return reply.code(400).send({
      message: result.message,
    });
  }

  if (result.kind === "CATEGORY_NOT_FOUND") {
    return reply.code(400).send({
      message: "Kategori tidak ditemukan.",
    });
  }

  if (result.kind === "NOT_FOUND") {
    return reply.code(404).send({
      message: "Menu tidak ditemukan.",
    });
  }

  return reply.code(200).send({
    message: "Menu berhasil diupdate",
    data: result.menu,
  });
};

export const deleteMenu = async (req: FastifyRequest, reply: FastifyReply) => {
  if (forbidIfNotOwner(req, reply)) return;

  const { id } = req.params as { id: string };
  const menuId = Number(id);

  const result = await menuService.deleteMenu(menuId);

  if (result.kind === "INVALID_ID") {
    return reply.code(400).send({
      message: "ID menu tidak valid.",
    });
  }

  if (result.kind === "NOT_FOUND") {
    return reply.code(404).send({
      message: "Menu tidak ditemukan.",
    });
  }

  return reply.code(200).send({
    message: "Menu berhasil dihapus",
  });
};