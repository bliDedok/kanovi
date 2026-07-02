import { FastifyInstance } from "fastify";
import { listStockMovements } from "../controllers/stockMovementController";

export default async function stockMovementRoutes(app: FastifyInstance) {
  app.get("/", listStockMovements);
}