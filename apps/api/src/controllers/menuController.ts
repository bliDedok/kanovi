import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Bantuan untuk mengecek apakah user adalah OWNER
const isOwner = (req: FastifyRequest) => {
  const user = (req as any).user;
  return user && user.role === 'OWNER';
};

// 1. CREATE: Tambah Menu Baru (Hanya Owner)
export const createMenu = async (req: FastifyRequest, reply: FastifyReply) => {
  if (!isOwner(req)) return reply.code(403).send({ message: "Akses ditolak. Hanya Owner." });

  const { name, price } = req.body as { name: string, price: number };
  
  if (!name || !price) {
    return reply.code(400).send({ message: "Nama dan harga menu wajib diisi." });
  }

  try {
    const newMenu = await prisma.menu.create({
      data: { name, price: Number(price) }
    });
    return reply.code(201).send({ message: "Menu berhasil ditambahkan", data: newMenu });
  } catch (error) {
    return reply.code(500).send({ message: "Gagal menyimpan menu" });
  }
};

// 2. READ: Ambil Semua Menu (Bisa Owner & Pegawai)
export const getAllMenus = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const menus = await prisma.menu.findMany({ orderBy: { id: "asc" } });
    return reply.code(200).send(menus);
  } catch (error) {
    return reply.code(500).send({ message: "Gagal mengambil data menu" });
  }
};

// 3. UPDATE: Edit Menu (Hanya Owner)
export const updateMenu = async (req: FastifyRequest, reply: FastifyReply) => {
  if (!isOwner(req)) return reply.code(403).send({ message: "Akses ditolak. Hanya Owner." });

  const { id } = req.params as { id: string };
  const { name, price } = req.body as { name?: string, price?: number };

  try {
    const updatedMenu = await prisma.menu.update({
      where: { id: Number(id) },
      data: { 
        ...(name && { name }), 
        ...(price && { price: Number(price) }) 
      }
    });
    return reply.code(200).send({ message: "Menu berhasil diupdate", data: updatedMenu });
  } catch (error) {
    return reply.code(500).send({ message: "Gagal mengupdate menu. Pastikan ID benar." });
  }
};

// 4. DELETE: Hapus Menu (Hanya Owner)
export const deleteMenu = async (req: FastifyRequest, reply: FastifyReply) => {
  if (!isOwner(req)) return reply.code(403).send({ message: "Akses ditolak. Hanya Owner." });

  const { id } = req.params as { id: string };

  try {
    await prisma.menu.delete({
      where: { id: Number(id) }
    });
    return reply.code(200).send({ message: "Menu berhasil dihapus" });
  } catch (error) {
    return reply.code(500).send({ message: "Gagal menghapus menu." });
  }
};