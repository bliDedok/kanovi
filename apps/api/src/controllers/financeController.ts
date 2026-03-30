import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../prisma";

export const financeController = {
  // 1. CEK SESI AKTIF
  getActiveSession: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { branch } = request.query as { branch: string };
      const session = await prisma.cashSession.findFirst({
        where: { branch: branch as any, status: "OPEN" },
      });
      return reply.send(session);
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  },

  // 2. BUKA TOKO
  openSession: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { branch, openedBy, initialCash } = request.body as any;
      const session = await prisma.cashSession.create({
        data: { branch, openedBy, initialCash: Number(initialCash), status: "OPEN" },
      });
      return reply.status(201).send(session);
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  },

  // 3. CATAT PENGELUARAN (Ini yang bikin error tadi)
  createExpense: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { sessionId, amount, description, recordedBy } = request.body as any;
      const expense = await prisma.expense.create({
        data: { 
          sessionId: Number(sessionId), 
          branch: "PUSAT", // Default, nanti diupdate otomatis di DB push
          amount: Number(amount), 
          description, 
          recordedBy 
        },
      });
      return reply.status(201).send(expense);
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  },

  // 4. EDIT / KOREKSI SESI
  updateSession: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };
      const { actualCash, initialCash, note } = request.body as any;
      await prisma.cashSession.update({
        where: { id: Number(id) },
        data: { 
          actualCash: actualCash ? Number(actualCash) : undefined,
          initialCash: initialCash ? Number(initialCash) : undefined,
          note 
        },
      });
      return reply.send({ message: "Sesi diperbarui" });
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  },

  // 5. TUTUP TOKO
  closeSession: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { sessionId, closedBy, actualCash, note } = request.body as any;
      const session = await prisma.cashSession.findUnique({
        where: { id: sessionId },
        include: { orders: true, expenses: true },
      });

      if (!session) return reply.status(404).send({ message: "Sesi tidak ditemukan" });

      const totalCashSales = session.orders
        .filter(o => o.paymentMethod === "CASH" && o.paymentStatus === "PAID")
        .reduce((sum, o) => sum + o.totalPrice, 0);
      const totalExpenses = session.expenses.reduce((sum, e) => sum + e.amount, 0);
      const expectedCash = session.initialCash + totalCashSales - totalExpenses;

      const closedSession = await prisma.cashSession.update({
        where: { id: sessionId },
        data: {
          status: "CLOSED",
          closedBy,
          closedAt: new Date(),
          expectedCash,
          actualCash: Number(actualCash),
          difference: Number(actualCash) - expectedCash,
          note
        },
      });
      return reply.send(closedSession);
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  },

  // 6. LAPORAN OWNER
getFinanceReport: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const sessions = await prisma.cashSession.findMany({
        include: { 
          orders: { 
            where: { paymentStatus: "PAID" },
            orderBy: { orderedAt: "desc" }
          }, 
          expenses: {
            orderBy: { createdAt: "desc" }
          } 
        },
        orderBy: { openedAt: "desc" },
      });

      const report = sessions.map(s => {
        const totalSales = s.orders.reduce((sum, o) => sum + o.totalPrice, 0);
        const cashSales = s.orders.filter(o => o.paymentMethod === "CASH").reduce((sum, o) => sum + o.totalPrice, 0);
        const qrisSales = s.orders.filter(o => o.paymentMethod === "QRIS").reduce((sum, o) => sum + o.totalPrice, 0);
        
        let shareKampus = s.branch === "RESTART" ? Math.round(totalSales * 0.25) : 0;
        let shareKanovi = totalSales - shareKampus;

        return {
          id: s.id,
          branch: s.branch,
          openedAt: s.openedAt,
          closedAt: s.closedAt,
          totalSales,
          cashSales,
          qrisSales,
          initialCash: s.initialCash,
          actualCash: s.actualCash,
          shareKampus,
          shareKanovi,
          expenses: s.expenses.reduce((sum, e) => sum + e.amount, 0),
          difference: s.difference || 0,
          note: s.note,
          status: s.status,
          // --- LOGIC BARU: Kirim list mentah untuk history ---
          orders: s.orders, 
          expenses_list: s.expenses 
        };
      });

      return reply.send(report);
    } catch (error: any) {
      return reply.status(500).send({ error: error.message });
    }
  }
};