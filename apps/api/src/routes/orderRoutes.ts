import { FastifyInstance } from "fastify";
import { verifyToken } from "../middleware/authMiddleware";
import { createOrder, checkOrderStock, payOrder, voidOrder } from "../controllers/orderController";

export default async function orderRoutes(app: FastifyInstance) {
  app.post("/", { preHandler: [verifyToken] }, createOrder);
  app.get("/:id/stock-check", { preHandler: [verifyToken] }, checkOrderStock);
  app.post("/:id/pay", { preHandler: [verifyToken] }, payOrder);
  app.post("/:id/void", voidOrder);
}