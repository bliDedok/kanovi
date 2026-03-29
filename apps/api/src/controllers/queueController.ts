// apps/api/src/controllers/queueController.ts

import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../prisma";

// helper untuk derive status order
function deriveOrderStatus(
  details: Array<{ prepStatus: "PENDING" | "ACCEPTED" | "STARTED" | "READY" | "SERVED" }>
): "NEW" | "IN_PROGRESS" | "READY" | "DONE" {
  if (details.length === 0) return "NEW";

  const allServed = details.every((d) => d.prepStatus === "SERVED");
  if (allServed) return "DONE";

  const allReadyOrServed = details.every(
    (d) => d.prepStatus === "READY" || d.prepStatus === "SERVED"
  );
  if (allReadyOrServed) return "READY";

  const hasStartedWork = details.some((d) =>
    ["ACCEPTED", "STARTED", "READY", "SERVED"].includes(d.prepStatus)
  );
  if (hasStartedWork) return "IN_PROGRESS";

  return "NEW";
}

// ====== 1. API LIST QUEUE PER STATION ======
export const getActiveQueue = async (request: FastifyRequest, reply: FastifyReply) => {
  const rawStation = (request.query as { station?: string }).station;
  const station = rawStation === "BAR" ? "BAR" : "KITCHEN";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    const orders = await prisma.order.findMany({
      where: {
        paymentStatus: "PAID",
        orderedAt: { gte: today },
        details: {
          some: {
            prepStation: station,
            prepStatus: { not: "SERVED" },
          },
        },
      },
      include: {
        user: true,
        details: {
          where: {
            prepStation: station,
            prepStatus: { not: "SERVED" },
          },
          include: {
            menu: { include: { category: true } },
          },
          orderBy: { id: "asc" },
        },
      },
      orderBy: { orderedAt: "asc" },
    });

    return reply.send({ success: true, data: orders });
  } catch (error) {
    console.error(error);
    return reply.code(500).send({ success: false, message: "Terjadi kesalahan sistem." });
  }
};

// ====== 2. API UPDATE STATUS ORDER ======
export const updateOrderItemStatus = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { detailId } = request.params as { detailId: string };
  const { status } = request.body as {
    status: "ACCEPTED" | "STARTED" | "READY" | "SERVED";
  };

  const validStatuses = ["ACCEPTED", "STARTED", "READY", "SERVED"];
  if (!validStatuses.includes(status)) {
    return reply.code(400).send({ success: false, message: "Status item tidak valid" });
  }

  try {
    const detail = await prisma.orderDetail.findUnique({
      where: { id: Number(detailId) },
    });

    if (!detail) {
      return reply.code(404).send({ success: false, message: "Item order tidak ditemukan" });
    }

    const now = new Date();

    const timestampPatch =
      status === "ACCEPTED"
        ? { acceptedAt: detail.acceptedAt ?? now }
        : status === "STARTED"
        ? {
            acceptedAt: detail.acceptedAt ?? now,
            startedAt: detail.startedAt ?? now,
          }
        : status === "READY"
        ? {
            acceptedAt: detail.acceptedAt ?? now,
            startedAt: detail.startedAt ?? now,
            readyAt: detail.readyAt ?? now,
          }
        : {
            acceptedAt: detail.acceptedAt ?? now,
            startedAt: detail.startedAt ?? now,
            readyAt: detail.readyAt ?? now,
            servedAt: detail.servedAt ?? now,
          };

    const updatedDetail = await prisma.orderDetail.update({
      where: { id: Number(detailId) },
      data: {
        prepStatus: status,
        ...timestampPatch,
      },
      include: {
        menu: true,
      },
    });

    const allDetails = await prisma.orderDetail.findMany({
      where: { orderId: detail.orderId },
      select: { prepStatus: true },
    });

    const nextOrderStatus = deriveOrderStatus(allDetails);

    await prisma.order.update({
      where: { id: detail.orderId },
      data: { status: nextOrderStatus },
    });

    return reply.send({
      success: true,
      data: updatedDetail,
      orderStatus: nextOrderStatus,
    });
  } catch (error) {
    console.error(error);
    return reply.code(500).send({ success: false, message: "Gagal mengupdate item order." });
  }
};

// ====== 3. API RIWAYAT ORDER (HISTORY) ======
export const getOrderHistory = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const orders = await prisma.order.findMany({
      where: { paymentStatus: "PAID" },
      include: {
        user: true,
        details: {
          include: {
            menu: {
              include: { category: true },
            },
          },
        },
      },
      orderBy: { orderedAt: "desc" },
    });

    return reply.send({ success: true, data: orders });
  } catch (error) {
    console.error(error);
    return reply.code(500).send({ success: false, message: "Gagal mengambil riwayat order." });
  }
};