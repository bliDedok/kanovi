import { FastifyInstance } from "fastify";
import { verifyToken } from "../middleware/authMiddleware";
import { getAllCategories, createCategory, updateCategory, deleteCategory } from "../controllers/categoryController";

export default async function categoryRoutes(app: FastifyInstance) {
  // Semua ini nanti otomatis beralamat di /categories atau /api/categories
  app.get("/", { preHandler: [verifyToken] }, getAllCategories);
  app.post("/", { preHandler: [verifyToken] }, createCategory);
  app.put("/:id", { preHandler: [verifyToken] }, updateCategory);
  app.delete("/:id", { preHandler: [verifyToken] }, deleteCategory);
}