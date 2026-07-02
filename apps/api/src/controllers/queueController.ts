import { FastifyRequest, FastifyReply } from "fastify";
import { queueService } from "../services/queueService";
import { PrepStatus } from "../repositories/queueRepository";

export const getActiveQueue = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const rawStation = (request.query as { station?: string }).station;

  try {
    const result = await queueService.getActiveQueue(rawStation);

    return reply.send({
      success: true,
      data: result.orders,
    });
  } catch (error) {
    console.error(error);

    return reply.code(500).send({
      success: false,
      message: "Terjadi kesalahan sistem.",
    });
  }
};

export const updateOrderItemStatus = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { detailId } = request.params as { detailId: string };
  const { status } = request.body as {
    status: PrepStatus;
  };

  try {
    const result = await queueService.updateOrderItemStatus({
      detailId: Number(detailId),
      status,
    });

    if (result.kind === "INVALID_DETAIL_ID") {
      return reply.code(400).send({
        success: false,
        message: "ID item order tidak valid",
      });
    }

    if (result.kind === "INVALID_STATUS") {
      return reply.code(400).send({
        success: false,
        message: "Status item tidak valid",
      });
    }

    if (result.kind === "DETAIL_NOT_FOUND") {
      return reply.code(404).send({
        success: false,
        message: "Item order tidak ditemukan",
      });
    }

    return reply.send({
      success: true,
      data: result.updatedDetail,
      orderStatus: result.orderStatus,
    });
  } catch (error) {
    console.error(error);

    return reply.code(500).send({
      success: false,
      message: "Gagal mengupdate item order.",
    });
  }
};

export const getOrderHistory = async (
  _request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const result = await queueService.getOrderHistory();

    return reply.send({
      success: true,
      data: result.orders,
    });
  } catch (error) {
    console.error(error);

    return reply.code(500).send({
      success: false,
      message: "Gagal mengambil riwayat order.",
    });
  }
};