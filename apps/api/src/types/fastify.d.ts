import "fastify";

declare module "fastify" {
  interface FastifyRequest {
    user?: {
      id?: number;
      userId?: number;
      role?: string;
      username?: string;
    };
  }
}