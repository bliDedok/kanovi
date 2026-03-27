import { FastifyInstance } from "fastify";
import { verifyToken } from "../middleware/authMiddleware";
import { getAllIngredients, getLowStockIngredients, createIngredient, updateIngredient, adjustIngredientStock } from "../controllers/ingredientController";

export default async function ingredientRoutes(app: FastifyInstance) {
  app.get("/", { preHandler: [verifyToken] }, getAllIngredients);
  app.get("/low-stock", { preHandler: [verifyToken] }, getLowStockIngredients);
  app.post("/", { preHandler: [verifyToken] }, createIngredient);
  app.patch("/:id", { preHandler: [verifyToken] }, updateIngredient);
  app.post("/:id/adjust", { preHandler: [verifyToken] }, adjustIngredientStock);
}