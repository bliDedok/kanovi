import { FastifyInstance } from "fastify";
import { verifyToken } from "../middleware/authMiddleware";
import { createMenu, getAllMenus, updateMenu, getMenuById, deleteMenu } from '../controllers/menuController';
import { getMenuRecipe, replaceMenuRecipe } from "../controllers/recipeController";

export default async function menuRoutes(app: FastifyInstance) {
  // Rute Utama Menu
  app.get("/", { preHandler: [verifyToken] }, getAllMenus);
  app.post("/", { preHandler: [verifyToken] }, createMenu);
  app.get("/:id", { preHandler: [verifyToken] }, getMenuById);
  app.patch("/:id", { preHandler: [verifyToken] }, updateMenu);
  app.delete("/:id", { preHandler: [verifyToken] }, deleteMenu);

  // Rute Sub-Menu (Resep)
  app.get("/:id/recipe", { preHandler: [verifyToken] }, getMenuRecipe);
  app.put("/:id/recipe", { preHandler: [verifyToken] }, replaceMenuRecipe);
}