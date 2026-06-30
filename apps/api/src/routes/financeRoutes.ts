import { FastifyInstance } from "fastify";
import { financeController } from "../controllers/financeController";
import { verifyToken, allowRoles } from "../middleware/authMiddleware";

const ownerOnly = [verifyToken, allowRoles(["OWNER"])];
const cashierOrOwner = [verifyToken, allowRoles(["OWNER", "MANAGER", "PEGAWAI"])];

export default async function financeRoutes(fastify: FastifyInstance) {
  fastify.get(
    "/sessions/active",
    { preHandler: cashierOrOwner },
    financeController.getActiveSession
  );

  fastify.post(
    "/sessions/open",
    { preHandler: cashierOrOwner },
    financeController.openSession
  );

  fastify.post(
    "/sessions/close",
    { preHandler: cashierOrOwner },
    financeController.closeSession
  );

  fastify.patch(
    "/sessions/:id",
    { preHandler: ownerOnly },
    financeController.updateSession
  );

  fastify.post(
    "/expenses",
    { preHandler: cashierOrOwner },
    financeController.createExpense
  );

  fastify.get(
    "/report",
    { preHandler: ownerOnly },
    financeController.getFinanceReport
  );
}