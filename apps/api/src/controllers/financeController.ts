import { FastifyRequest, FastifyReply } from "fastify";
import { financeService } from "../services/financeService";

export const financeController = {
  getActiveSession: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { branch } = request.query as { branch?: string };

      const session = await financeService.getActiveSession(branch);

      return reply.send(session);
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  },

  openSession: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { branch, openedBy, initialCash } = request.body as any;

      const result = await financeService.openSession({
        branch,
        openedBy,
        initialCash,
      });

      if (result.kind === "ALREADY_OPEN") {
        return reply.send({
          success: true,
          alreadyOpen: true,
          message: "Sesi kasir masih aktif.",
          session: result.session,
        });
      }

      return reply.status(201).send({
        success: true,
        alreadyOpen: false,
        session: result.session,
      });
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  },

  createExpense: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { sessionId, amount, description, recordedBy } =
        request.body as any;

      const result = await financeService.createExpense({
        sessionId: Number(sessionId),
        amount: Number(amount),
        description,
        recordedBy,
      });

      if (result.kind === "SESSION_NOT_FOUND") {
        return reply.code(404).send({
          success: false,
          message: "Sesi kasir tidak ditemukan.",
        });
      }

      if (result.kind === "SESSION_CLOSED") {
        return reply.code(409).send({
          success: false,
          message: "Sesi kasir sudah ditutup.",
        });
      }

      return reply.status(201).send(result.expense);
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  },

  updateSession: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const { actualCash, initialCash, note } = request.body as any;

      await financeService.updateSession({
        sessionId: Number(id),
        actualCash:
          actualCash !== undefined ? Number(actualCash) : undefined,
        initialCash:
          initialCash !== undefined ? Number(initialCash) : undefined,
        note,
      });

      return reply.send({ message: "Sesi diperbarui" });
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  },

  closeSession: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { sessionId, closedBy, actualCash, note } = request.body as any;

      const result = await financeService.closeSession({
        sessionId: Number(sessionId),
        closedBy,
        actualCash: Number(actualCash || 0),
        note,
      });

      if (result.kind === "SESSION_ID_REQUIRED") {
        return reply.code(400).send({
          success: false,
          message: "Session ID wajib diisi.",
        });
      }

      if (result.kind === "NOT_FOUND") {
        return reply.code(404).send({
          success: false,
          message: "Sesi kasir tidak ditemukan.",
        });
      }

      if (result.kind === "ALREADY_CLOSED") {
        return reply.send({
          success: true,
          alreadyClosed: true,
          message: "Sesi kasir sudah ditutup.",
          session: result.session,
        });
      }

      return reply.send({
        success: true,
        message: "Sesi kasir berhasil ditutup.",
        session: result.session,
        summary: result.summary,
      });
    } catch (error: any) {
      console.error("Gagal menutup sesi kasir:", error);

      return reply.code(500).send({
        success: false,
        message: error?.message || "Gagal menutup sesi kasir.",
      });
    }
  },

  getFinanceReport: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { from, to } = request.query as { from?: string; to?: string };

      const result = await financeService.getFinanceReport({
        from,
        to,
      });

      return reply.send(result);
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  },
};