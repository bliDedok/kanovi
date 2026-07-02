"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  const [newOrder, setNewOrder] = useState<Order | null>(null);
  const knownOrderIdsRef = useRef<Set<number>>(new Set());
  const initializedRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const soundEnabledRef = useRef(true);
  const audioUnlockedRef = useRef(false);

  const fetchQueue = useCallback(async () => {
  try {
    const json = await api.getQueue("KITCHEN");
    const incomingOrders: Order[] = json.data || [];

    if (!initializedRef.current) {
      incomingOrders.forEach((order) => {
        knownOrderIdsRef.current.add(order.id);
      });

      initializedRef.current = true;
      setOrders(incomingOrders);
      return;
    }

    const newOrders = incomingOrders.filter(
      (order) => !knownOrderIdsRef.current.has(order.id)
    );

    if (newOrders.length > 0) {
      console.log("NEW ORDER DETECTED", newOrders);

    if (
      soundEnabledRef.current &&
      audioUnlockedRef.current
    ) {
      audioRef.current?.play().catch(() => {});
    }

      setNewOrder(newOrders[0]);
    }

    incomingOrders.forEach((order) => {
      knownOrderIdsRef.current.add(order.id);
    });

    setOrders(incomingOrders);
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

  useEffect(() => {
    const audio = new Audio("/sounds/new-order.mp3");

    audio.preload = "auto";

    audioRef.current = audio;

    const unlockAudio = () => {
      if (
        audioUnlockedRef.current ||
        !audioRef.current
      )
        return;

      audioRef.current
        .play()
        .then(() => {
          audioRef.current?.pause();

          if (audioRef.current) {
            audioRef.current.currentTime = 0;
          }

          audioUnlockedRef.current = true;
        })
        .catch(() => {});
    };

    window.addEventListener("click", unlockAudio, {
      once: true,
    });

    return () => {
      window.removeEventListener(
        "click",
        unlockAudio
      );
    };
  }, []);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
}, [soundEnabled]);

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

  const clearNewOrderNotification = useCallback(() => {
  setNewOrder(null);
}, []);

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;

      soundEnabledRef.current = next;

      localStorage.setItem(
        "kanovi_queue_sound",
        String(next)
      );

      return next;
    });
  }, []);

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
    newOrder,
    clearNewOrderNotification,
    soundEnabled,
    toggleSound,
  };
}

