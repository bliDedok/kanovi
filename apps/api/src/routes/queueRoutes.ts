import { FastifyInstance } from "fastify";
import { verifyToken } from "../middleware/authMiddleware";
import { getActiveQueue, updateOrderStatus, getOrderHistory } from "../controllers/queueController";

export default async function queueRoutes(app: FastifyInstance) {
  // Menggunakan prefix /api di index.ts nanti, jadi di sini tulis rutenya langsung
  app.get("/queue", { preHandler: [verifyToken] }, getActiveQueue);
  app.patch("/queue/:id/status", { preHandler: [verifyToken] }, updateOrderStatus);
  app.get("/orders/history", { preHandler: [verifyToken] }, getOrderHistory);
}