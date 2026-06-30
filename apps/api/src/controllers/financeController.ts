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

    if (!sessionId) {
      return reply.code(400).send({
        success: false,
        message: "Session ID wajib diisi.",
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const session = await tx.cashSession.findUnique({
        where: { id: Number(sessionId) },
      });

      if (!session) {
        return {
          kind: "NOT_FOUND" as const,
        };
      }

      if (session.closedAt) {
        return {
          kind: "ALREADY_CLOSED" as const,
          session,
        };
      }

      const sessionOrders = await tx.order.findMany({
        where: {
          sessionId: Number(sessionId),
          paymentStatus: {
            in: ["PAID", "VOID"],
          },
        },
        select: {
          id: true,
          paymentStatus: true,
          paymentMethod: true,
          totalPrice: true,
        },
      });

      const paidOrders = sessionOrders.filter(
        (order) => order.paymentStatus === "PAID"
      );

      const voidOrders = sessionOrders.filter(
        (order) => order.paymentStatus === "VOID"
      );

      const cashSales = paidOrders
        .filter((order) => order.paymentMethod === "CASH")
        .reduce((sum, order) => sum + order.totalPrice, 0);

      const qrisSales = paidOrders
        .filter((order) => order.paymentMethod === "QRIS")
        .reduce((sum, order) => sum + order.totalPrice, 0);

      const sessionExpenses = await tx.expense.findMany({
        where: {
          sessionId: Number(sessionId),
        },
      });

      const expenses = sessionExpenses.reduce(
        (sum, expense) => sum + expense.amount,
        0
      );

      const openingCash = Number(session.initialCash || 0);
      const grossSales = cashSales + qrisSales;
      const netSales = grossSales - expenses;
      const expectedCash = openingCash + cashSales - expenses;
      const actualCashNumber = Number(actualCash || 0);
      const difference = actualCashNumber - expectedCash;

      const closedSession = await tx.cashSession.update({
        where: { id: Number(sessionId) },
        data: {
          status: "CLOSED",
          closedBy,
          closedAt: new Date(),
          actualCash: actualCashNumber,
          expectedCash,
          difference,
          note,
        },
      });

      return {
        kind: "SUCCESS" as const,
        session: closedSession,
        summary: {
          openingCash,
          cashSales,
          qrisSales,
          expenses,
          expectedCash,
          actualCash: actualCashNumber,
          difference,
          totalOrders: paidOrders.length,
          totalVoidOrders: voidOrders.length,
          grossSales,
          netSales,
        },
      };
    });

    if (result.kind === "NOT_FOUND") {
      return reply.code(404).send({
        success: false,
        message: "Sesi kasir tidak ditemukan.",
      });
    }

    if (result.kind === "ALREADY_CLOSED") {
      return reply.code(409).send({
        success: false,
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
    const paidOrders = s.orders.filter(
      (order) => order.paymentStatus === "PAID"
    );

    const cashSales = paidOrders
      .filter((order) => order.paymentMethod === "CASH")
      .reduce((sum, order) => sum + order.totalPrice, 0);

    const qrisSales = paidOrders
      .filter((order) => order.paymentMethod === "QRIS")
      .reduce((sum, order) => sum + order.totalPrice, 0);

    const totalExpenses = s.expenses.reduce(
      (sum, expense) => sum + expense.amount,
      0
    );

    const grossSales = cashSales + qrisSales;
    const netSales = grossSales - totalExpenses;

    const expectedCash = s.initialCash + cashSales - totalExpenses;
    const actualCash = Number(s.actualCash || 0);
    const difference = actualCash - expectedCash;

    paidOrders.forEach((order) => {
      order.details.forEach((detail) => {
        const existing = productStats.get(String(detail.menuId)) || {
          name: detail.menu.name,
          qty: 0,
          revenue: 0,
        };

        productStats.set(String(detail.menuId), {
          name: detail.menu.name,
          qty: existing.qty + detail.qty,
          revenue: existing.revenue + detail.price * detail.qty,
        });
      });
    });

    const shareKampus = s.branch === "RESTART" ? netSales * 0.25 : 0;
    const shareKanovi = netSales - shareKampus;

    return {
      id: s.id,
      branch: s.branch,
      openedAt: s.openedAt,
      closedAt: s.closedAt,
      status: s.status,

      initialCash: s.initialCash,
      actualCash,

      cashSales,
      qrisSales,
      totalSales: grossSales,
      grossSales,
      netSales,

      expenses: totalExpenses,
      expectedCash,
      difference,

      shareKampus,
      shareKanovi,

      orders: s.orders,
      expenses_list: s.expenses,
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