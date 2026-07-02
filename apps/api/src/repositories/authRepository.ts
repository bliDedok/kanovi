import { prisma } from "../prisma";

export class AuthRepository {
  findUserByUsername(username: string) {
    return prisma.user.findUnique({
      where: {
        username,
      },
    });
  }
}

export const authRepository = new AuthRepository();