"use client";

import { PrepStatus } from "../../../../types";
import {
  getPrepActionLabel,
  isActivePrepStatus,
} from "../domain/prep-status";

type Props = {
  detailId: number;
  menuName: string;
  qty: number;
  prepStatus: PrepStatus;
  onAdvanceStatus: (detailId: number, status: Exclude<PrepStatus, "SERVED">) => void;
};

export default function KitchenOrderItemRow({
  detailId,
  menuName,
  qty,
  prepStatus,
  onAdvanceStatus,
}: Props) {
  const actionLabel = getPrepActionLabel(prepStatus);

  return (
    <div className="rounded-xl border border-kanovi-cream/50 dark:border-white/10 p-3 bg-white/70 dark:bg-gray-900/40">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-kanovi-coffee dark:text-white">
            {menuName}
          </p>
          <p className="text-sm text-kanovi-coffee/70 dark:text-gray-400">
            Qty: {qty}
          </p>
          <p className="text-xs mt-1 text-kanovi-coffee/60 dark:text-gray-500">
            Status: {prepStatus}
          </p>
        </div>

        {actionLabel && isActivePrepStatus(prepStatus) && (
          <button
            onClick={() => onAdvanceStatus(detailId, prepStatus)}
            className="px-3 py-2 rounded-lg bg-kanovi-coffee text-white text-sm font-medium hover:opacity-90 transition"
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}