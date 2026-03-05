import { FastifyRequest, FastifyReply } from 'fastify'; 
import { PrismaClient } from '@prisma/client';
import bcrypt from "bcryptjs";
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export const loginUser = async (req: FastifyRequest, reply: FastifyReply) => {
  // Ambil data dari body (di-cast ke any sementara karena tipe body bawaan Fastify adalah unknown)
  const { username, password } = req.body as any;

  if (!username) {
    return reply.code(400).send({ message: "Username tidak boleh kosong" });
  }
  if (!password) {
    return reply.code(400).send({ message: "Password tidak boleh kosong" });
  }

  try {
    const user = await prisma.user.findUnique({ where: { username } });
    
    if (!user) {
      return reply.code(401).send({ message: "Username atau password salah" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return reply.code(401).send({ message: "Username atau password salah" });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role }, 
      process.env.JWT_SECRET || 'rahasia_negara', 
      { expiresIn: '1d' }
    );

    return reply.code(200).send({ 
      message: "Login berhasil",
      token, 
      role: user.role 
    });
    
  } catch (error) {
    console.error(error);
    return reply.code(500).send({ message: "Terjadi kesalahan pada server" });
  }
};