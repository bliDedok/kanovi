import { prisma } from "../prisma";

export type PrepStation = "KITCHEN" | "BAR";
export type PrepStatus = "PENDING" | "ACCEPTED" | "STARTED" | "READY" | "SERVED";

export class QueueRepository {
  findActiveQueue(station: PrepStation, today: Date) {
    return prisma.order.findMany({
      where: {
        paymentStatus: "PAID",
        orderedAt: {
          gte: today,
        },
        details: {
          some: {
            prepStation: station,
            prepStatus: {
              not: "SERVED",
            },
          },
        },
      },
      select: {
        id: true,
        queueNumber: true,
        status: true,
        orderedAt: true,
        customerName: true,
        user: true,
        details: {
          where: {
            prepStation: station,
            prepStatus: {
              not: "SERVED",
            },
          },
          include: {
            menu: {
              include: {
                category: true,
              },
            },
          },
          orderBy: {
            id: "asc",
          },
        },
      },
      orderBy: {
        orderedAt: "asc",
      },
    });
  }

  findOrderDetailById(detailId: number) {
    return prisma.orderDetail.findUnique({
      where: {
        id: detailId,
      },
    });
  }

  updateOrderDetailStatus(input: {
    detailId: number;
    status: PrepStatus;
    timestampPatch: {
      acceptedAt?: Date;
      startedAt?: Date;
      readyAt?: Date;
      servedAt?: Date;
    };
  }) {
    return prisma.orderDetail.update({
      where: {
        id: input.detailId,
      },
      data: {
        prepStatus: input.status,
        ...input.timestampPatch,
      },
      include: {
        menu: true,
      },
    });
  }

  findOrderDetailStatuses(orderId: number) {
    return prisma.orderDetail.findMany({
      where: {
        orderId,
      },
      select: {
        prepStatus: true,
      },
    });
  }

  updateOrderStatus(orderId: number, status: "NEW" | "IN_PROGRESS" | "READY" | "DONE") {
    return prisma.order.update({
      where: {
        id: orderId,
      },
      data: {
        status,
      },
    });
  }

  findOrderHistory() {
    return prisma.order.findMany({
      where: {
        paymentStatus: {
          in: ["PAID", "VOID"],
        },
      },
      select: {
        id: true,
        queueNumber: true,
        status: true,
        paymentStatus: true,
        paymentMethod: true,
        totalPrice: true,
        orderedAt: true,
        paidAt: true,
        customerName: true,

        voidReason: true,
        voidedBy: true,
        voidedAt: true,

        user: true,
        details: {
          include: {
            menu: {
              include: {
                category: true,
              },
            },
          },
        },
      },
      orderBy: {
        orderedAt: "desc",
      },
    });
  }
}

export const queueRepository = new QueueRepository();