import { financeRepository } from "../repositories/financeRepository";

type OpenSessionInput = {
  branch?: string;
  openedBy?: string;
  initialCash?: number;
};

type CreateExpenseInput = {
  sessionId: number;
  amount: number;
  description?: string;
  recordedBy?: string;
};

type UpdateSessionInput = {
  sessionId: number;
  actualCash?: number;
  initialCash?: number;
  note?: string;
};

type CloseSessionInput = {
  sessionId: number;
  closedBy?: string;
  actualCash?: number;
  note?: string;
};

type FinanceReportInput = {
  from?: string;
  to?: string;
};

export class FinanceService {
  async getActiveSession(branch?: string) {
    return financeRepository.findOpenSession(branch);
  }

  async openSession(input: OpenSessionInput) {
    const selectedBranch = input.branch || "PUSAT";

    const existingOpenSession =
      await financeRepository.findOpenSessionByBranch(selectedBranch);

    if (existingOpenSession) {
      return {
        kind: "ALREADY_OPEN" as const,
        session: existingOpenSession,
      };
    }

    const session = await financeRepository.createSession({
      branch: selectedBranch,
      openedBy: input.openedBy,
      initialCash: Number(input.initialCash || 0),
    });

    return {
      kind: "SUCCESS" as const,
      session,
    };
  }

  async createExpense(input: CreateExpenseInput) {
    const session = await financeRepository.findSessionForExpense(
      input.sessionId
    );

    if (!session) {
      return {
        kind: "SESSION_NOT_FOUND" as const,
      };
    }

    if (session.status !== "OPEN") {
      return {
        kind: "SESSION_CLOSED" as const,
      };
    }

    const expense = await financeRepository.createExpense({
      sessionId: input.sessionId,
      branch: session.branch,
      amount: Number(input.amount),
      description: input.description,
      recordedBy: input.recordedBy,
    });

    return {
      kind: "SUCCESS" as const,
      expense,
    };
  }

  async updateSession(input: UpdateSessionInput) {
    await financeRepository.updateSession(input.sessionId, {
      actualCash:
        input.actualCash !== undefined ? Number(input.actualCash) : undefined,
      initialCash:
        input.initialCash !== undefined ? Number(input.initialCash) : undefined,
      note: input.note,
    });

    return {
      kind: "SUCCESS" as const,
    };
  }

  async closeSession(input: CloseSessionInput) {
    if (!input.sessionId) {
      return {
        kind: "SESSION_ID_REQUIRED" as const,
      };
    }

    return financeRepository.closeSession({
      sessionId: Number(input.sessionId),
      closedBy: input.closedBy,
      actualCash: Number(input.actualCash || 0),
      note: input.note,
    });
  }

  async getFinanceReport(input: FinanceReportInput) {
    const dateFilter: any = {};

    if (input.from || input.to) {
      dateFilter.closedAt = {};

      if (input.from) {
        const startOfDay = new Date(input.from);
        startOfDay.setHours(0, 0, 0, 0);
        dateFilter.closedAt.gte = startOfDay;
      }

      if (input.to) {
        const endOfDay = new Date(input.to);
        endOfDay.setHours(23, 59, 59, 999);
        dateFilter.closedAt.lte = endOfDay;
      }
    }

    const sessions = await financeRepository.findClosedSessions(dateFilter);

    const productStats = new Map<
      string,
      { name: string; qty: number; revenue: number }
    >();

    const reports = sessions.map((session) => {
      const paidOrders = session.orders.filter(
        (order) => order.paymentStatus === "PAID"
      );

      const cashSales = paidOrders
        .filter((order) => order.paymentMethod === "CASH")
        .reduce((sum, order) => sum + order.totalPrice, 0);

      const qrisSales = paidOrders
        .filter((order) => order.paymentMethod === "QRIS")
        .reduce((sum, order) => sum + order.totalPrice, 0);

      const totalExpenses = session.expenses.reduce(
        (sum, expense) => sum + expense.amount,
        0
      );

      const grossSales = cashSales + qrisSales;
      const netSales = grossSales - totalExpenses;

      const expectedCash = session.initialCash + cashSales - totalExpenses;
      const actualCash = Number(session.actualCash || 0);
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

      const shareKampus = session.branch === "RESTART" ? netSales * 0.25 : 0;
      const shareKanovi = netSales - shareKampus;

      return {
        id: session.id,
        branch: session.branch,
        openedAt: session.openedAt,
        closedAt: session.closedAt,
        status: session.status,

        initialCash: session.initialCash,
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

        orders: session.orders,
        expenses_list: session.expenses,
      };
    });

    const topProducts = Array.from(productStats.values())
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    return {
      reports,
      topProducts,
    };
  }
}

export const financeService = new FinanceService();