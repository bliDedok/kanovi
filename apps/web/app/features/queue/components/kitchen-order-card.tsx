"use client";

import { Order, PrepStatus } from "../../../../types";
import { getWaitTimeInfo } from "../lib/get-wait-time-info";
import KitchenOrderItemRow from "./kitchen-order-item-row";

type Props = {
  order: Order;
  now: Date;
  onAdvanceStatus: (detailId: number, status: Exclude<PrepStatus, "SERVED">) => void;
};

export default function KitchenOrderCard({ order, now, onAdvanceStatus }: Props) {
  const { diffMins, isOverdue } = getWaitTimeInfo(order.orderedAt, now);

  return (
    <div className="rounded-2xl bg-kanovi-bone dark:bg-[#1a1a1a] border border-kanovi-cream/50 dark:border-white/5 shadow-sm p-4">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-kanovi-coffee dark:text-white">
            Order #{order.id}
          </h2>
          <p className="text-sm text-kanovi-coffee/70 dark:text-gray-400">
            {order.customerName || "Walk-in"}
          </p>
        </div>

        <div
          className={`text-xs font-bold px-3 py-1 rounded-full ${
            isOverdue
              ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
              : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
          }`}
        >
          {diffMins} menit
        </div>
      </div>

      <div className="space-y-3">
        {order.details.map((detail) => (
          <KitchenOrderItemRow
            key={detail.id}
            detailId={detail.id}
            menuName={detail.menu.name}
            qty={detail.qty}
            prepStatus={detail.prepStatus}
            onAdvanceStatus={onAdvanceStatus}
          />
        ))}
      </div>
    </div>
  );
}