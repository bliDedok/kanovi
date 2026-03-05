import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';

export const verifyToken = async (req: FastifyRequest, reply: FastifyReply) => {
  // Ambil header Authorization (biasanya formatnya: "Bearer eyJhbGci...")
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    return reply.code(401).send({ message: "Akses ditolak. Token tidak ditemukan." });
  }

  const token = authHeader.split(' ')[1]; // Ambil tokennya saja tanpa kata "Bearer"
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'rahasia_negara');
    (req as any).user = decoded; // Simpan data user (id & role) ke request agar bisa dibaca fungsi lain
  } catch (error) {
    return reply.code(401).send({ message: "Token tidak valid atau sudah kadaluarsa." });
  }
};