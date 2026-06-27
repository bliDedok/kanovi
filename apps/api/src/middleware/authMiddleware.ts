import { FastifyReply, FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";

interface JwtPayload {
  id?: number;
  userId?: number;
  role?: string;
  username?: string;
}

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET belum diatur di environment variable.");
  }

  return secret;
};

export const verifyToken = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return reply.code(401).send({
      success: false,
      message: "Akses ditolak. Token tidak ditemukan atau format salah.",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as JwtPayload;
    request.user = decoded;
  } catch {
    return reply.code(401).send({
      success: false,
      message: "Akses ditolak. Token tidak valid atau sudah kedaluwarsa.",
    });
  }
};

export const allowRoles = (roles: string[]) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const userRole = request.user?.role;

    if (!userRole || !roles.includes(userRole)) {
      return reply.code(403).send({
        success: false,
        message: "Akses ditolak. Anda tidak memiliki izin untuk fitur ini.",
      });
    }
  };
};