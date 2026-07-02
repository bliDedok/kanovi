import {
  PrepStation,
  PrepStatus,
  queueRepository,
} from "../repositories/queueRepository";

type OrderStatus = "NEW" | "IN_PROGRESS" | "READY" | "DONE";

function deriveOrderStatus(
  details: Array<{ prepStatus: PrepStatus }>
): OrderStatus {
  if (details.length === 0) return "NEW";

  const allServed = details.every((detail) => detail.prepStatus === "SERVED");

  if (allServed) return "DONE";

  const allReadyOrServed = details.every(
    (detail) => detail.prepStatus === "READY" || detail.prepStatus === "SERVED"
  );

  if (allReadyOrServed) return "READY";

  const hasStartedWork = details.some((detail) =>
    ["ACCEPTED", "STARTED", "READY", "SERVED"].includes(detail.prepStatus)
  );

  if (hasStartedWork) return "IN_PROGRESS";

  return "NEW";
}

function buildTimestampPatch(
  status: PrepStatus,
  detail: {
    acceptedAt: Date | null;
    startedAt: Date | null;
    readyAt: Date | null;
    servedAt: Date | null;
  }
) {
  const now = new Date();

  if (status === "ACCEPTED") {
    return {
      acceptedAt: detail.acceptedAt ?? now,
    };
  }

  if (status === "STARTED") {
    return {
      acceptedAt: detail.acceptedAt ?? now,
      startedAt: detail.startedAt ?? now,
    };
  }

  if (status === "READY") {
    return {
      acceptedAt: detail.acceptedAt ?? now,
      startedAt: detail.startedAt ?? now,
      readyAt: detail.readyAt ?? now,
    };
  }

  return {
    acceptedAt: detail.acceptedAt ?? now,
    startedAt: detail.startedAt ?? now,
    readyAt: detail.readyAt ?? now,
    servedAt: detail.servedAt ?? now,
  };
}

export class QueueService {
  async getActiveQueue(rawStation?: string) {
    const station: PrepStation = rawStation === "BAR" ? "BAR" : "KITCHEN";

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const orders = await queueRepository.findActiveQueue(station, today);

    return {
      kind: "SUCCESS" as const,
      orders,
    };
  }

  async updateOrderItemStatus(input: {
    detailId: number;
    status: PrepStatus;
  }) {
    const validStatuses: PrepStatus[] = ["ACCEPTED", "STARTED", "READY", "SERVED"];

    if (!Number.isFinite(input.detailId)) {
      return {
        kind: "INVALID_DETAIL_ID" as const,
      };
    }

    if (!validStatuses.includes(input.status)) {
      return {
        kind: "INVALID_STATUS" as const,
      };
    }

    const detail = await queueRepository.findOrderDetailById(input.detailId);

    if (!detail) {
      return {
        kind: "DETAIL_NOT_FOUND" as const,
      };
    }

    const timestampPatch = buildTimestampPatch(input.status, detail);

    const updatedDetail = await queueRepository.updateOrderDetailStatus({
      detailId: input.detailId,
      status: input.status,
      timestampPatch,
    });

    const allDetails = await queueRepository.findOrderDetailStatuses(
      detail.orderId
    );

    const nextOrderStatus = deriveOrderStatus(allDetails);

    await queueRepository.updateOrderStatus(detail.orderId, nextOrderStatus);

    return {
      kind: "SUCCESS" as const,
      updatedDetail,
      orderStatus: nextOrderStatus,
    };
  }

  async getOrderHistory() {
    const orders = await queueRepository.findOrderHistory();

    return {
      kind: "SUCCESS" as const,
      orders,
    };
  }
}

export const queueService = new QueueService();