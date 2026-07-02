import { FastifyRequest, FastifyReply } from "fastify";
import { categoryService } from "../services/categoryService";

function isOwner(req: FastifyRequest) {
  const user = req.user as any;

  return user?.role === "OWNER";
}

function forbidIfNotOwner(req: FastifyRequest, reply: FastifyReply) {
  if (!isOwner(req)) {
    reply.code(403).send({
      message: "Akses ditolak. Hanya Owner.",
    });

    return true;
  }

  return false;
}

export const getAllCategories = async (
  _req: FastifyRequest,
  reply: FastifyReply
) => {
  const categories = await categoryService.getAllCategories();

  return reply.send(categories);
};

export const createCategory = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  if (forbidIfNotOwner(req, reply)) return;

  const { name, sortOrder, isActive } = req.body as {
    name: string;
    sortOrder?: number;
    isActive?: boolean;
  };

  const result = await categoryService.createCategory({
    name,
    sortOrder,
    isActive,
  });

  if (result.kind === "VALIDATION_ERROR") {
    return reply.code(400).send({
      message: result.message,
    });
  }

  if (result.kind === "DUPLICATE") {
    return reply.code(409).send({
      message: "Kategori sudah ada.",
    });
  }

  return reply.code(201).send({
    message: "Kategori berhasil ditambahkan.",
    data: result.category,
  });
};

export const updateCategory = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  if (forbidIfNotOwner(req, reply)) return;

  const { id } = req.params as { id: string };
  const categoryId = Number(id);

  if (!Number.isFinite(categoryId)) {
    return reply.code(400).send({
      message: "ID kategori tidak valid.",
    });
  }

  const { name, sortOrder, isActive } = req.body as {
    name?: string;
    sortOrder?: number;
    isActive?: boolean;
  };

  const result = await categoryService.updateCategory({
    id: categoryId,
    name,
    sortOrder,
    isActive,
  });

  if (result.kind === "VALIDATION_ERROR") {
    return reply.code(400).send({
      message: result.message,
    });
  }

  if (result.kind === "NOT_FOUND") {
    return reply.code(404).send({
      message: "Kategori tidak ditemukan.",
    });
  }

  return reply.send({
    message: "Kategori berhasil diupdate.",
    data: result.category,
  });
};

export const deleteCategory = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  if (forbidIfNotOwner(req, reply)) return;

  const { id } = req.params as { id: string };
  const categoryId = Number(id);

  if (!Number.isFinite(categoryId)) {
    return reply.code(400).send({
      message: "ID kategori tidak valid.",
    });
  }

  const result = await categoryService.deleteCategory(categoryId);

  if (result.kind === "USED_BY_MENU") {
    return reply.code(409).send({
      message: "Kategori tidak bisa dihapus karena masih dipakai menu.",
    });
  }

  if (result.kind === "NOT_FOUND") {
    return reply.code(404).send({
      message: "Kategori tidak ditemukan.",
    });
  }

  return reply.send({
    message: "Kategori berhasil dihapus.",
  });
};