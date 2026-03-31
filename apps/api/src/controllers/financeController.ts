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
    const { from, to } = request.query as { from?: string; to?: string };
    
    // Logic Filter Tanggal
    const dateFilter: any = {};
    if (from || to) {
      dateFilter.openedAt = {};
      if (from) dateFilter.openedAt.gte = new Date(from);
      if (to) {
        const endOfDay = new Date(to);
        endOfDay.setHours(23, 59, 59, 999);
        dateFilter.openedAt.lte = endOfDay;
      }
    }

    const sessions = await prisma.cashSession.findMany({
      where: dateFilter,
      orderBy: { openedAt: "desc" },
      include: {
        orders: {
          where: { paymentStatus: "PAID" },
          include: { details: { include: { menu: true } } }
        },
        expenses: true,
      },
    });

    // --- LOGIC ANALITIK PRODUK TERLARIS (Top 5) ---
    const productStats = new Map<string, { name: string, qty: number, revenue: number }>();
    
    const reports = sessions.map((s) => {
      const totalSales = s.orders.reduce((sum, o) => sum + o.totalPrice, 0);
      const totalExpenses = s.expenses.reduce((sum, e) => sum + e.amount, 0);
      
      // Hitung per produk untuk analitik
      s.orders.forEach(order => {
        order.details.forEach(detail => {
          const existing = productStats.get(String(detail.menuId)) || { name: detail.menu.name, qty: 0, revenue: 0 };
          productStats.set(String(detail.menuId), {
            name: detail.menu.name,
            qty: existing.qty + detail.qty,
            revenue: existing.revenue + (detail.price * detail.qty)
          });
        });
      });

      const shareKampus = s.branch === "RESTART" ? totalSales * 0.25 : 0;
      const shareKanovi = totalSales - shareKampus;

      return {
        id: s.id,
        branch: s.branch,
        openedAt: s.openedAt,
        closedAt: s.closedAt,
        status: s.status,
        initialCash: s.initialCash,
        actualCash: s.actualCash,
        totalSales,
        expenses: totalExpenses,
        difference: (s.actualCash || 0) - (s.initialCash + totalSales - totalExpenses),
        shareKampus,
        shareKanovi,
        orders: s.orders,
        expenses_list: s.expenses
      };
    });

    const topProducts = Array.from(productStats.values())
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    return reply.send({ reports, topProducts });
  } catch (error: any) {
    return reply.status(500).send({ error: error.message });
  }
}
};