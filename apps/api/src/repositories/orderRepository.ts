import { prisma } from "../prisma";

export class OrderRepository {
  findMenusByIds(menuIds: number[]) {
    return prisma.menu.findMany({
      where: {
        id: {
          in: menuIds,
        },
      },
      select: {
        id: true,
        name: true,
        price: true,
        prepStation: true,
        isAvailable: true,
      },
    });
  }

  createOrder(data: Parameters<typeof prisma.order.create>[0]["data"]) {
    return prisma.order.create({
      data,
      include: {
        details: true,
      },
    });
  }

  findOrderById(id: number) {
    return prisma.order.findUnique({
      where: { id },
      include: {
        details: true,
      },
    });
  }
}

export const orderRepository = new OrderRepository();