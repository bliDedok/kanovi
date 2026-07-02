import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { authRepository } from "../repositories/authRepository";

type LoginInput = {
  username: string;
  password: string;
};

export class AuthService {
  async login(input: LoginInput) {
    if (!input.username?.trim()) {
      return {
        kind: "USERNAME_REQUIRED" as const,
      };
    }

    if (!input.password) {
      return {
        kind: "PASSWORD_REQUIRED" as const,
      };
    }

    const user = await authRepository.findUserByUsername(input.username);

    if (!user) {
      return {
        kind: "INVALID_CREDENTIALS" as const,
      };
    }

    const isMatch = await bcrypt.compare(input.password, user.password);

    if (!isMatch) {
      return {
        kind: "INVALID_CREDENTIALS" as const,
      };
    }

    if (!process.env.JWT_SECRET) {
      return {
        kind: "JWT_SECRET_MISSING" as const,
      };
    }

    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    return {
      kind: "SUCCESS" as const,
      token,
      role: user.role,
    };
  }
}

export const authService = new AuthService();