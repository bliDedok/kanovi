import { prisma } from "../prisma";

export class FinanceRepository {
  findOpenSession(branch?: string) {
    return prisma.cashSession.findFirst({
      where: {
        ...(branch ? { branch: branch as any } : {}),
        status: "OPEN",
      },
      orderBy: {
        openedAt: "desc",
      },
    });
  }

  findOpenSessionByBranch(branch: string) {
    return prisma.cashSession.findFirst({
      where: {
        branch: branch as any,
        status: "OPEN",
      },
      orderBy: {
        openedAt: "desc",
      },
    });
  }

  createSession(data: {
    branch: string;
    openedBy?: string;
    initialCash: number;
  }) {
    return prisma.cashSession.create({
      data: {
        branch: data.branch as any,
        openedBy: data.openedBy || "Admin",
        initialCash: data.initialCash,
        status: "OPEN",
      },
    });
  }

  findSessionById(sessionId: number) {
    return prisma.cashSession.findUnique({
      where: { id: sessionId },
    });
  }

  findSessionForExpense(sessionId: number) {
    return prisma.cashSession.findUnique({
      where: { id: sessionId },
      select: {
        branch: true,
        status: true,
      },
    });
  }

  createExpense(data: {
    sessionId: number;
    branch: string;
    amount: number;
    description?: string;
    recordedBy?: string;
  }) {
    return prisma.expense.create({
      data: {
        sessionId: data.sessionId,
        branch: data.branch as any,
        amount: data.amount,
        description: data.description || "-",
        recordedBy: data.recordedBy || "Admin",
      },
    });
  }

  updateSession(
    sessionId: number,
    data: {
      actualCash?: number;
      initialCash?: number;
      note?: string;
    }
  ) {
    return prisma.cashSession.update({
      where: { id: sessionId },
      data: {
        actualCash: data.actualCash,
        initialCash: data.initialCash,
        note: data.note,
      },
    });
  }

  closeSession(input: {
    sessionId: number;
    closedBy?: string;
    actualCash: number;
    note?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const session = await tx.cashSession.findUnique({
        where: { id: input.sessionId },
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

      const paidOrders = await tx.order.findMany({
        where: {
          sessionId: input.sessionId,
          paymentStatus: "PAID",
        },
        select: {
          id: true,
          paymentStatus: true,
          paymentMethod: true,
          totalPrice: true,
        },
      });

      const voidOrders = await tx.order.findMany({
        where: {
          sessionId: input.sessionId,
          paymentStatus: "VOID",
        },
        select: {
          id: true,
        },
      });

      const sessionExpenses = await tx.expense.findMany({
        where: {
          sessionId: input.sessionId,
        },
      });

      const cashSales = paidOrders
        .filter((order) => order.paymentMethod === "CASH")
        .reduce((sum, order) => sum + order.totalPrice, 0);

      const qrisSales = paidOrders
        .filter((order) => order.paymentMethod === "QRIS")
        .reduce((sum, order) => sum + order.totalPrice, 0);

      const expenses = sessionExpenses.reduce(
        (sum, expense) => sum + expense.amount,
        0
      );

      const openingCash = Number(session.initialCash || 0);
      const grossSales = cashSales + qrisSales;
      const netSales = grossSales - expenses;
      const expectedCash = openingCash + cashSales - expenses;
      const difference = input.actualCash - expectedCash;

      const closedSession = await tx.cashSession.update({
        where: { id: input.sessionId },
        data: {
          status: "CLOSED",
          closedBy: input.closedBy || "Admin",
          closedAt: new Date(),
          actualCash: input.actualCash,
          expectedCash,
          difference,
          note: input.note || null,
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
          actualCash: input.actualCash,
          difference,
          totalOrders: paidOrders.length,
          totalVoidOrders: voidOrders.length,
          grossSales,
          netSales,
        },
      };
    });
  }

  findClosedSessions(dateFilter: any) {
    return prisma.cashSession.findMany({
      where: {
        ...dateFilter,
        status: "CLOSED",
      },
      orderBy: {
        closedAt: "desc",
      },
      include: {
        orders: {
          where: {
            paymentStatus: "PAID",
          },
          include: {
            details: {
              include: {
                menu: true,
              },
            },
          },
        },
        expenses: true,
      },
    });
  }
}

export const financeRepository = new FinanceRepository();