import { FastifyRequest, FastifyReply } from 'fastify'; 
import { prisma } from "../prisma";

function isOwner(req: FastifyRequest) {
  const user = req.user as any;
  return user?.role === "OWNER";
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export const getAllCategories = async (_req: FastifyRequest, reply: FastifyReply) => {
  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return reply.send(categories);
};

export const createCategory = async (req: FastifyRequest, reply: FastifyReply) => {
  if (!isOwner(req)) {
    return reply.code(403).send({ message: "Akses ditolak. Hanya Owner." });
  }

  const { name, sortOrder, isActive } = req.body as {
    name: string;
    sortOrder?: number;
    isActive?: boolean;
  };

  if (!name?.trim()) {
    return reply.code(400).send({ message: "Nama kategori wajib diisi." });
  }

  const slug = slugify(name);

  const existing = await prisma.category.findUnique({
    where: { slug },
  });

  if (existing) {
    return reply.code(409).send({ message: "Kategori sudah ada." });
  }

  const category = await prisma.category.create({
    data: {
      name: name.trim(),
      slug,
      sortOrder: sortOrder ?? 0,
      isActive: isActive ?? true,
    },
  });

  return reply.code(201).send({
    message: "Kategori berhasil ditambahkan.",
    data: category,
  });
};

export const updateCategory = async (req: FastifyRequest, reply: FastifyReply) => {
  if (!isOwner(req)) {
    return reply.code(403).send({ message: "Akses ditolak. Hanya Owner." });
  }

  const { id } = req.params as { id: string };
  const { name, sortOrder, isActive } = req.body as {
    name?: string;
    sortOrder?: number;
    isActive?: boolean;
  };

  const data: any = {};

  if (name !== undefined) {
    data.name = name.trim();
    data.slug = slugify(name);
  }

  if (sortOrder !== undefined) data.sortOrder = sortOrder;
  if (isActive !== undefined) data.isActive = isActive;

  try {
    const category = await prisma.category.update({
      where: { id: Number(id) },
      data,
    });

    return reply.send({
      message: "Kategori berhasil diupdate.",
      data: category,
    });
  } catch {
    return reply.code(404).send({ message: "Kategori tidak ditemukan." });
  }
};

export const deleteCategory = async (req: FastifyRequest, reply: FastifyReply) => {
  if (!isOwner(req)) {
    return reply.code(403).send({ message: "Akses ditolak. Hanya Owner." });
  }

  const { id } = req.params as { id: string };
  const categoryId = Number(id);

  const usedByMenus = await prisma.menu.count({
    where: { categoryId },
  });

  if (usedByMenus > 0) {
    return reply.code(409).send({
      message: "Kategori tidak bisa dihapus karena masih dipakai menu.",
    });
  }

  try {
    await prisma.category.delete({
      where: { id: categoryId },
    });

    return reply.send({ message: "Kategori berhasil dihapus." });
  } catch {
    return reply.code(404).send({ message: "Kategori tidak ditemukan." });
  }
};