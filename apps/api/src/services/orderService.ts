import { prisma } from "../prisma";
import { orderRepository } from "../repositories/orderRepository";
import {
  buildStockRequirements,
  getOrderStockSummary,
} from "./stockService";
import { paymentService } from "./paymentService";
import { PaymentMethod } from "../strategies/paymentStrategy";

type OrderItemInput = {
  menuId: number;
  qty: number;
};

type CreateOrderInput = {
  origin: "COUNTER" | "KITCHEN" | "BAR";
  customerName?: string;
  items: OrderItemInput[];
  branch?: "PUSAT" | "RESTART";
  sessionId?: number;
  userId: number;
};

type PayOrderInput = {
  orderId: number;
  paymentMethod: PaymentMethod;
  overrideStock: boolean;
  overrideNote?: string;
};

type VoidOrderInput = {
  orderId: number;
  pin: string;
  reason: string;
  voidedBy?: string;
};

async function generateQueueNumber(tx: any) {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const prefix = `#${day}-`;

  const existingOrders = await tx.order.findMany({
    where: {
      queueNumber: {
        startsWith: prefix,
      },
    },
    select: {
      queueNumber: true,
    },
    orderBy: {
      id: "desc",
    },
    take: 100,
  });

  let maxSequence = 0;

  for (const order of existingOrders) {
    if (!order.queueNumber) continue;

    const sequenceText = order.queueNumber.replace(prefix, "");
    const sequenceNumber = Number(sequenceText);

    if (Number.isFinite(sequenceNumber)) {
      maxSequence = Math.max(maxSequence, sequenceNumber);
    }
  }

  const nextSequence = String(maxSequence + 1).padStart(3, "0");

  return `${prefix}${nextSequence}`;
}

export class OrderService {
  async createOrder(input: CreateOrderInput) {
    const menus = await orderRepository.findMenusByIds(
      input.items.map((item) => item.menuId)
    );

    const menuMap = new Map(menus.map((menu) => [menu.id, menu]));

    if (menus.length !== new Set(input.items.map((item) => item.menuId)).size) {
      return {
        kind: "MENU_NOT_FOUND" as const,
      };
    }

    const unavailableMenus = menus.filter((menu) => !menu.isAvailable);

    if (unavailableMenus.length > 0) {
      return {
        kind: "MENU_NOT_AVAILABLE" as const,
        menus: unavailableMenus.map((menu) => ({
          id: menu.id,
          name: menu.name,
        })),
      };
    }

    const details = input.items.map((item) => {
      const menu = menuMap.get(item.menuId)!;
      const subtotal = menu.price * item.qty;

      return {
        menuId: menu.id,
        qty: item.qty,
        price: menu.price,
        subtotal,
        prepStation: menu.prepStation,
        prepStatus: "PENDING" as const,
      };
    });

    const totalPrice = details.reduce((sum, item) => sum + item.subtotal, 0);

    const order = await orderRepository.createOrder({
      userId: input.userId,
      origin: input.origin,
      customerName: input.customerName,
      totalPrice,
      branch: input.branch || "PUSAT",
      sessionId: input.sessionId || null,
      paymentStatus: "UNPAID",
      details: {
        create: details,
      },
    });

    return {
      kind: "SUCCESS" as const,
      order,
    };
  }

  async checkOrderStock(orderId: number) {
    const summary = await getOrderStockSummary(orderId);

    if (!summary) {
      return {
        kind: "NOT_FOUND" as const,
      };
    }

    return {
      kind: "SUCCESS" as const,
      orderId: summary.order.id,
      hasShortage: summary.shortages.length > 0,
      requirements: summary.requirements,
      shortages: summary.shortages,
    };
  }

  async payOrder(input: PayOrderInput) {
    return prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(
        `SELECT id FROM "Order" WHERE id = ${input.orderId} FOR UPDATE`
      );

      const lockedOrder = await tx.order.findUnique({
        where: { id: input.orderId },
        include: {
          details: {
            include: {
              menu: {
                select: {
                  id: true,
                  name: true,
                  isAvailable: true,
                },
              },
            },
          },
        },
      });

      if (!lockedOrder) {
        return { kind: "NOT_FOUND" as const };
      }

      if (lockedOrder.paymentStatus === "PAID") {
        return {
          kind: "ALREADY_PAID" as const,
          order: lockedOrder,
        };
      }

      if (lockedOrder.paymentStatus === "VOID") {
        return { kind: "VOID" as const };
      }

      const unavailableMenus = lockedOrder.details
        .map((detail) => detail.menu)
        .filter((menu) => !menu.isAvailable);

      if (unavailableMenus.length > 0) {
        return {
          kind: "MENU_NOT_AVAILABLE" as const,
          menus: unavailableMenus.map((menu) => ({
            id: menu.id,
            name: menu.name,
          })),
        };
      }

      const menuIds = [...new Set(lockedOrder.details.map((d) => d.menuId))];

      const recipes = menuIds.length
        ? await tx.recipe.findMany({
            where: { menuId: { in: menuIds } },
          })
        : [];

      const ingredientIds = [...new Set(recipes.map((r) => r.ingredientId))];

      if (ingredientIds.length) {
        await tx.$executeRawUnsafe(
          `SELECT id FROM "Ingredient" WHERE id IN (${ingredientIds.join(
            ","
          )}) FOR UPDATE`
        );
      }

      const lockedIngredients = ingredientIds.length
        ? await tx.ingredient.findMany({
            where: { id: { in: ingredientIds } },
          })
        : [];

      const requirements = buildStockRequirements(
        lockedOrder.details,
        recipes,
        lockedIngredients
      );

      const shortages = requirements.filter((item) => item.shortBy > 0);

      if (shortages.length > 0 && !input.overrideStock) {
        return {
          kind: "SHORTAGE" as const,
          shortages,
        };
      }

      await paymentService.processPayment(
        input.paymentMethod,
        lockedOrder.totalPrice
      );

      const didOverride = shortages.length > 0 && input.overrideStock;
      const queueNumber = await generateQueueNumber(tx);

      const paidOrder = await tx.order.update({
        where: { id: lockedOrder.id },
        data: {
          paymentStatus: "PAID",
          paymentMethod: input.paymentMethod,
          stockOverride: didOverride,
          overrideNote: didOverride ? input.overrideNote : null,
          paidAt: lockedOrder.paidAt ?? new Date(),
          queueNumber,
        },
        include: { details: true },
      });

      for (const item of requirements) {
        await tx.ingredient.update({
          where: { id: item.ingredientId },
          data: { stock: { decrement: item.need } },
        });

        await tx.stockMovement.create({
          data: {
            ingredientId: item.ingredientId,
            qtyChange: -item.need,
            reason: didOverride ? "SALE_OVERRIDE" : "SALE",
            orderId: lockedOrder.id,
          },
        });
      }

      return {
        kind: "PAID" as const,
        order: paidOrder,
        shortages,
      };
    });
  }

  async voidOrder(input: VoidOrderInput) {
    const managerPin = process.env.MANAGER_PIN || "123456";

    if (input.pin !== managerPin) {
      return {
        kind: "INVALID_PIN" as const,
      };
    }

    return prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(
        `SELECT id FROM "Order" WHERE id = ${input.orderId} FOR UPDATE`
      );

      const lockedOrder = await tx.order.findUnique({
        where: { id: input.orderId },
      });

      if (!lockedOrder) {
        return {
          kind: "NOT_FOUND" as const,
        };
      }

      if (lockedOrder.paymentStatus === "VOID") {
        return {
          kind: "ALREADY_VOID" as const,
        };
      }

      const movements = await tx.stockMovement.findMany({
        where: { orderId: input.orderId },
      });

      for (const movement of movements) {
        const amountToReturn = Math.abs(movement.qtyChange);

        await tx.ingredient.update({
          where: { id: movement.ingredientId },
          data: { stock: { increment: amountToReturn } },
        });

        await tx.stockMovement.create({
          data: {
            ingredientId: movement.ingredientId,
            qtyChange: amountToReturn,
            reason: "RESTOCK",
            orderId: input.orderId,
          },
        });
      }

      const voidedOrder = await tx.order.update({
        where: { id: input.orderId },
        data: {
          paymentStatus: "VOID",
          voidReason: input.reason,
          voidedBy: input.voidedBy || "Manager",
          voidedAt: new Date(),
        },
      });

      if (lockedOrder.sessionId) {
        const session = await tx.cashSession.findUnique({
          where: { id: lockedOrder.sessionId },
        });

        if (session && session.status === "CLOSED") {
          const paidOrders = await tx.order.findMany({
            where: {
              sessionId: lockedOrder.sessionId,
              paymentStatus: "PAID",
            },
            select: {
              paymentMethod: true,
              totalPrice: true,
            },
          });

          const cashSales = paidOrders
            .filter((order) => order.paymentMethod === "CASH")
            .reduce((sum, order) => sum + order.totalPrice, 0);

          const qrisSales = paidOrders
            .filter((order) => order.paymentMethod === "QRIS")
            .reduce((sum, order) => sum + order.totalPrice, 0);

          const expenses = await tx.expense.findMany({
            where: {
              sessionId: lockedOrder.sessionId,
            },
            select: {
              amount: true,
            },
          });

          const totalExpenses = expenses.reduce(
            (sum, expense) => sum + expense.amount,
            0
          );

          const expectedCash =
            Number(session.initialCash || 0) + cashSales - totalExpenses;

          const actualCash = Number(session.actualCash || 0);
          const difference = actualCash - expectedCash;

          await tx.cashSession.update({
            where: { id: lockedOrder.sessionId },
            data: {
              expectedCash,
              difference,
            },
          });
        }
      }

      return {
        kind: "SUCCESS" as const,
        order: voidedOrder,
      };
    });
  }
}

export const orderService = new OrderService();