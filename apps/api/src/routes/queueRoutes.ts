import { FastifyInstance } from "fastify";
import { verifyToken } from "../middleware/authMiddleware";
import {
  getActiveQueue,
  updateOrderItemStatus,
  getOrderHistory,
} from "../controllers/queueController";

export default async function queueRoutes(app: FastifyInstance) {
  app.get("/queue", { preHandler: [verifyToken] }, getActiveQueue);
  app.patch("/queue/items/:detailId/status", { preHandler: [verifyToken] }, updateOrderItemStatus);
  app.get("/orders/history", { preHandler: [verifyToken] }, getOrderHistory);
}