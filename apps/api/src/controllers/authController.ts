import { FastifyRequest, FastifyReply } from "fastify";
import { authService } from "../services/authService";

export const loginUser = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  const { username, password } = req.body as {
    username?: string;
    password?: string;
  };

  try {
    const result = await authService.login({
      username: username || "",
      password: password || "",
    });

    if (result.kind === "USERNAME_REQUIRED") {
      return reply.code(400).send({
        message: "Username tidak boleh kosong",
      });
    }

    if (result.kind === "PASSWORD_REQUIRED") {
      return reply.code(400).send({
        message: "Password tidak boleh kosong",
      });
    }

    if (result.kind === "INVALID_CREDENTIALS") {
      return reply.code(401).send({
        message: "Username atau password salah",
      });
    }

    if (result.kind === "JWT_SECRET_MISSING") {
      return reply.code(500).send({
        message: "JWT_SECRET belum diatur di server.",
      });
    }

    return reply.code(200).send({
      message: "Login berhasil",
      token: result.token,
      role: result.role,
    });
  } catch (error) {
    console.error(error);

    return reply.code(500).send({
      message: "Terjadi kesalahan pada server",
    });
  }
};