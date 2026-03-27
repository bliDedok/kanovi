// apps/api/src/controllers/queueController.ts

import { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../prisma";

// ====== 1. API LIST QUEUE PER STATION ======
export const getActiveQueue = async (request: FastifyRequest, reply: FastifyReply) => {
  const { station } = request.query as { station?: string };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    const orders = await prisma.order.findMany({
      where: {
        paymentStatus: "PAID",
        status: { in: ["NEW", "IN_PROGRESS", "READY"] },
        orderedAt: { gte: today }, 
      },
      include: {
        details: {
          include: {
            menu: {
              include: { category: true },
            },
          },
        },
      },
      orderBy: { orderedAt: "asc" },
    });

    const mappedOrders = orders.map((order) => {
      let filteredDetails = order.details;

      if (station === "BAR") {
        filteredDetails = order.details.filter((d) => {
          const catName = d.menu.category?.name.toLowerCase() || "";
          return catName.includes("minum") || catName.includes("kopi") || catName.includes("teh");
        });
      } else if (station === "KITCHEN") {
        filteredDetails = order.details.filter((d) => {
          const catName = d.menu.category?.name.toLowerCase() || "";
          return !catName.includes("minum") && !catName.includes("kopi") && !catName.includes("teh");
        });
      }

      return {
        ...order,
        details: filteredDetails,
      };
    }).filter((order) => order.details.length > 0); 

    return reply.send({ success: true, data: mappedOrders });
  } catch (error) {
    console.error(error);
    return reply.code(500).send({ success: false, message: "Terjadi kesalahan sistem." });
  }
};

// ====== 2. API UPDATE STATUS ORDER ======
export const updateOrderStatus = async (request: FastifyRequest, reply: FastifyReply) => {
  const { id } = request.params as { id: string };
  const { status } = request.body as { status: "NEW" | "IN_PROGRESS" | "READY" | "DONE" };

  // Validasi keamanan: Pastikan status yang dikirim sesuai dengan Enum Prisma
  const validStatuses = ["NEW", "IN_PROGRESS", "READY", "DONE"];
  if (!validStatuses.includes(status)) {
    return reply.code(400).send({ success: false, message: "Status tidak valid" });
  }

  try {
    const updatedOrder = await prisma.order.update({
      where: { id: Number(id) },
      data: { status },
    });

    return reply.send({ success: true, data: updatedOrder });
  } catch (error) {
    console.error(error);
    return reply.code(500).send({ success: false, message: "Gagal mengupdate status order." });
  }
};

// ====== 3. API RIWAYAT ORDER (HISTORY) ======
export const getOrderHistory = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const orders = await prisma.order.findMany({
      where: { paymentStatus: "PAID" },
      include: {
        details: {
          include: { menu: true },
        },
      },
      orderBy: { orderedAt: "asc" }, 
    });

    return reply.send({ success: true, data: orders });
  } catch (error) {
    console.error(error);
    return reply.code(500).send({ success: false, message: "Gagal mengambil riwayat order." });
  }
};