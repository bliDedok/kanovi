import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';

// 1. Sesuaikan Payload dengan tipe data di fastify.d.ts (id menggunakan number)
interface JwtPayload {
  id?: number;
  userId?: number;
  role?: string;
  username?: string;
}

export const verifyToken = async (request: FastifyRequest, reply: FastifyReply) => {
  const authHeader = request.headers['authorization'];
  
  // 2. Validasi ganda: Pastikan header ada DAN formatnya benar berawalan "Bearer "
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.code(401).send({ 
      success: false, 
      message: "Akses ditolak. Token tidak ditemukan atau format salah." 
    });
  }

  // 3. Ambil token aslinya
  const token = authHeader.split(' ')[1];
  
  try {
    // 4. Verifikasi dan paksa tipe datanya menjadi JwtPayload yang baru
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'rahasia_negara'
    ) as JwtPayload;
    
    // 5. Simpan data hasil decode ke object request. 
    request.user = decoded; 
    
  } catch (error) {
    return reply.code(401).send({ 
      success: false, 
      message: "Akses ditolak. Token tidak valid atau sudah kadaluarsa." 
    });
  }
};