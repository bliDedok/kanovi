import { FastifyInstance } from "fastify";
import { financeController } from "../controllers/financeController";

export default async function financeRoutes(fastify: FastifyInstance) {
  fastify.get("/sessions/active", financeController.getActiveSession);
  fastify.post("/sessions/open", financeController.openSession);
  fastify.post("/sessions/close", financeController.closeSession);
  fastify.patch("/sessions/:id", financeController.updateSession);
  fastify.post("/expenses", financeController.createExpense); 
  fastify.get("/report", financeController.getFinanceReport);
}