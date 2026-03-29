"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Order, PrepStatus } from "../../../../types";
import { api } from "../../../../lib/api";
import {
  isActivePrepStatus,
  nextPrepStatusMap,
  ActivePrepStatus,
} from "../domain/prep-status";

export function useKitchenQueue() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchQueue = useCallback(async () => {
    try {
      const json = await api.getQueue("KITCHEN");
      setOrders(json.data || []);
    } catch (error) {
      console.error("Gagal mengambil data antrian", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueue();

    const pollingInterval = setInterval(fetchQueue, 10000);

    return () => {
      clearInterval(pollingInterval);
    };
  }, [fetchQueue]);

  const updateItemStatus = useCallback(
    async (detailId: number, currentStatus: ActivePrepStatus) => {
      const nextStatus = nextPrepStatusMap[currentStatus];
      if (!nextStatus) return;

      try {
        await api.updateOrderItemStatus(detailId, nextStatus);
        await fetchQueue();
      } catch (error) {
        console.error("Gagal update status item", error);
        alert("Gagal mengupdate status item pesanan.");
      }
    },
    [fetchQueue]
  );

  const activeOrders = useMemo(() => {
    return orders
      .map((order) => ({
        ...order,
        details: order.details.filter((detail) => detail.prepStatus !== "SERVED"),
      }))
      .filter((order) => order.details.length > 0);
  }, [orders]);

  return {
    orders: activeOrders,
    isLoading,
    refreshQueue: fetchQueue,
    updateItemStatus,
  };
}