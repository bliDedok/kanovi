"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDownCircle,
  ArrowLeft,
  ArrowUpCircle,
  CalendarDays,
  Filter,
  Search,
} from "lucide-react";
import { api } from "../../../lib/api";
import type {
  StockMovement,
  StockMovementResponse,
  StockReason,
} from "../../../types";

const reasonOptions: { label: string; value: "" | StockReason }[] = [
  { label: "Semua Reason", value: "" },
  { label: "SALE", value: "SALE" },
  { label: "RESTOCK", value: "RESTOCK" },
  { label: "ADJUSTMENT", value: "ADJUSTMENT" },
  { label: "SPOIL", value: "SPOIL" },
  { label: "SALE_OVERRIDE", value: "SALE_OVERRIDE" },
];

const reasonLabels: Record<StockReason, string> = {
  SALE: "Penjualan",
  RESTOCK: "Stok Masuk",
  ADJUSTMENT: "Adjustment",
  SPOIL: "Spoil",
  SALE_OVERRIDE: "Sale Override",
};

const reasonBadgeClass: Record<StockReason, string> = {
  SALE: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300",
  RESTOCK:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  ADJUSTMENT:
    "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
  SPOIL:
    "bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300",
  SALE_OVERRIDE:
    "bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300",
};

const emptySummary = {
  stockIn: 0,
  stockOut: 0,
  totalMovements: 0,
};

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

const formatNumber = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 2,
  }).format(value);

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

const formatQtyChange = (movement: StockMovement) => {
  const sign = movement.qtyChange > 0 ? "+" : "";

  return `${sign}${formatNumber(movement.qtyChange)} ${
    movement.ingredient.unit
  }`;
};

export default function StockMovementHistoryPage() {
  const router = useRouter();

  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [summary, setSummary] = useState(emptySummary);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState<"" | StockReason>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchMovements = async (filters?: {
    startDate?: string;
    endDate?: string;
    reason?: "" | StockReason;
  }) => {
    try {
      setIsLoading(true);

    const selectedStartDate = filters?.startDate ?? startDate;
    const selectedEndDate = filters?.endDate ?? endDate;
    const selectedReason = filters?.reason ?? reason;

    const response = (await api.getStockMovements({
    startDate: selectedStartDate || undefined,
    endDate: selectedEndDate || undefined,
    reason: selectedReason || undefined,
    })) as StockMovementResponse;

      setMovements(response.data || []);
      setSummary(response.summary || emptySummary);
    } catch (error: any) {
      alert(error?.message || "Gagal memuat riwayat perubahan stok.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMovements({
      startDate: "",
      endDate: "",
      reason: "",
    });
  }, []);

  const filteredMovements = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();

    if (!keyword) return movements;

    return movements.filter((movement) => {
      const ingredientName = movement.ingredient.name.toLowerCase();
      const ingredientUnit = movement.ingredient.unit.toLowerCase();
      const orderId = movement.orderId ? String(movement.orderId) : "";
      const reasonText = movement.reason.toLowerCase();

      return (
        ingredientName.includes(keyword) ||
        ingredientUnit.includes(keyword) ||
        orderId.includes(keyword) ||
        reasonText.includes(keyword)
      );
    });
  }, [movements, searchQuery]);

  const handleApplyFilter = () => {
    fetchMovements();
  };

  const handleResetFilter = () => {
    setStartDate("");
    setEndDate("");
    setReason("");
    setSearchQuery("");

    fetchMovements({
      startDate: "",
      endDate: "",
      reason: "",
    });
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
    <div>
        <h1 className="text-3xl font-black text-kanovi-coffee dark:text-white">
        Riwayat Perubahan Stok
        </h1>

        <p className="mt-1 text-sm text-kanovi-coffee/70 dark:text-kanovi-bone/70">
        Pantau stok masuk, stok keluar, adjustment, spoil, dan pengurangan
        stok dari transaksi.
        </p>
    </div>

    <button
        type="button"
        onClick={() => router.push("/dashboard/inventory")}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-kanovi-wood px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-kanovi-coffee"
    >
        <ArrowLeft className="h-4 w-4" />
        Kembali ke Inventory
    </button>
    </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-kanovi-darker">
          <div className="flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-widest text-kanovi-coffee/60 dark:text-kanovi-bone/60">
              Total Movement
            </p>
            <Filter className="h-5 w-5 text-kanovi-wood" />
          </div>

          <p className="mt-3 text-3xl font-black text-kanovi-coffee dark:text-white">
            {formatNumber(summary.totalMovements)}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-kanovi-darker">
          <div className="flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-widest text-kanovi-coffee/60 dark:text-kanovi-bone/60">
              Stok Masuk
            </p>
            <ArrowUpCircle className="h-5 w-5 text-emerald-500" />
          </div>

          <p className="mt-3 text-3xl font-black text-emerald-500">
            +{formatNumber(summary.stockIn)}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-kanovi-darker">
          <div className="flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-widest text-kanovi-coffee/60 dark:text-kanovi-bone/60">
              Stok Keluar
            </p>
            <ArrowDownCircle className="h-5 w-5 text-red-500" />
          </div>

          <p className="mt-3 text-3xl font-black text-red-500">
            -{formatNumber(summary.stockOut)}
          </p>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-kanovi-darker">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-[1.4fr_0.8fr_0.8fr_0.9fr_auto_auto]">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-kanovi-coffee/60 dark:text-kanovi-bone/60">
              Cari Data
            </label>

            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-kanovi-coffee/50 dark:text-kanovi-bone/50" />

              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Cari bahan, order ID, reason..."
                className="h-12 w-full rounded-xl border border-kanovi-cream bg-white pl-11 pr-4 text-sm text-kanovi-coffee outline-none focus:ring-2 focus:ring-kanovi-wood dark:border-white/10 dark:bg-black/20 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-kanovi-coffee/60 dark:text-kanovi-bone/60">
              Dari Tanggal
            </label>

            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-kanovi-coffee/50 dark:text-kanovi-bone/50" />

              <input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="kanovi-date-input h-12 w-full rounded-xl border border-kanovi-cream bg-white pl-11 pr-4 text-sm text-kanovi-coffee outline-none focus:ring-2 focus:ring-kanovi-wood dark:border-white/10 dark:bg-black/20 dark:text-kanovi-bone dark:color-scheme:dark"
                />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-kanovi-coffee/60 dark:text-kanovi-bone/60">
              Sampai Tanggal
            </label>

            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-kanovi-coffee/50 dark:text-kanovi-bone/50" />

              <input
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                className="kanovi-date-input h-12 w-full rounded-xl border border-kanovi-cream bg-white pl-11 pr-4 text-sm text-kanovi-coffee outline-none focus:ring-2 focus:ring-kanovi-wood dark:border-white/10 dark:bg-black/20 dark:text-kanovi-bone dark:color-scheme:dark"
                />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-kanovi-coffee/60 dark:text-kanovi-bone/60">
              Reason
            </label>

            <select
              value={reason}
              onChange={(event) =>
                setReason(event.target.value as "" | StockReason)
              }
              className="h-12 w-full rounded-xl border border-kanovi-cream bg-white px-4 text-sm text-kanovi-coffee outline-none focus:ring-2 focus:ring-kanovi-wood dark:border-white/10 dark:bg-black/20 dark:text-white"
            >
              {reasonOptions.map((option) => (
                <option key={option.value || "ALL"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={handleApplyFilter}
              className="h-12 w-full rounded-xl bg-kanovi-wood px-5 text-sm font-bold text-white transition hover:bg-kanovi-coffee"
            >
              Terapkan
            </button>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={handleResetFilter}
              className="h-12 w-full rounded-xl bg-kanovi-bone px-5 text-sm font-bold text-kanovi-coffee transition hover:bg-kanovi-cream dark:bg-kanovi-dark dark:text-kanovi-bone"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-kanovi-darker">
        <div className="overflow-x-auto">
          <table className="w-full min-w-245 text-left">
            <thead className="bg-kanovi-paper text-xs uppercase tracking-widest text-kanovi-coffee/70 dark:bg-white/5 dark:text-kanovi-bone/70">
              <tr>
                <th className="px-5 py-4">Waktu</th>
                <th className="px-5 py-4">Bahan</th>
                <th className="px-5 py-4">Qty Change</th>
                <th className="px-5 py-4">Reason</th>
                <th className="px-5 py-4">Order</th>
                <th className="px-5 py-4">Stok Saat Ini</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-kanovi-cream/40 dark:divide-white/5">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-10 text-center text-sm text-kanovi-coffee/60 dark:text-kanovi-bone/60"
                  >
                    Memuat riwayat stok...
                  </td>
                </tr>
              ) : filteredMovements.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-10 text-center text-sm text-kanovi-coffee/60 dark:text-kanovi-bone/60"
                  >
                    Tidak ada data riwayat stok.
                  </td>
                </tr>
              ) : (
                filteredMovements.map((movement) => {
                  const isStockIn = movement.qtyChange > 0;
                  const isStockOut = movement.qtyChange < 0;

                  return (
                    <tr
                      key={movement.id}
                      className="hover:bg-kanovi-bone/60 dark:hover:bg-white/5"
                    >
                      <td className="px-5 py-4 text-sm text-kanovi-coffee dark:text-kanovi-bone">
                        {formatDateTime(movement.createdAt)}
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-bold text-kanovi-coffee dark:text-white">
                          {movement.ingredient.name}
                        </p>

                        <p className="text-xs text-kanovi-coffee/60 dark:text-kanovi-bone/60">
                          Unit: {movement.ingredient.unit}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${
                            isStockIn
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                              : isStockOut
                              ? "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300"
                              : "bg-kanovi-bone text-kanovi-coffee dark:bg-kanovi-dark dark:text-kanovi-bone"
                          }`}
                        >
                          {formatQtyChange(movement)}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                            reasonBadgeClass[movement.reason]
                          }`}
                        >
                          {reasonLabels[movement.reason]}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm">
                        {movement.orderId ? (
                          <div>
                            <p className="font-bold text-kanovi-coffee dark:text-white">
                              Order #{movement.orderId}
                            </p>

                            <p className="text-xs text-kanovi-coffee/60 dark:text-kanovi-bone/60">
                              {movement.order?.paymentMethod || "-"} ·{" "}
                              {formatCurrency(movement.order?.totalPrice || 0)}
                            </p>
                          </div>
                        ) : (
                          <span className="text-kanovi-coffee/50 dark:text-kanovi-bone/50">
                            Tidak terkait order
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-sm font-bold text-kanovi-coffee dark:text-white">
                        {formatNumber(movement.ingredient.stock)}{" "}
                        {movement.ingredient.unit}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}