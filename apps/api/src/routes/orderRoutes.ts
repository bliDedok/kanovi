import { FastifyInstance } from "fastify";
import { verifyToken } from "../middleware/authMiddleware";
import { createOrder, checkOrderStock, payOrder } from "../controllers/orderController";

export default async function orderRoutes(app: FastifyInstance) {
  // Rute ini akan diawali dengan prefix yang ditentukan di index.ts (misal: /api/orders)
  app.post("/", { preHandler: [verifyToken] }, createOrder);
  app.get("/:id/stock-check", { preHandler: [verifyToken] }, checkOrderStock);
  app.post("/:id/pay", { preHandler: [verifyToken] }, payOrder);
}