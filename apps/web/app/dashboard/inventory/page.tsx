"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Search,
  Plus,
  Package,
  Edit3,
  Settings2,
  History,
} from "lucide-react";
import { api } from "../../../lib/api";
import { Ingredient, StockReason } from "../../../types";
import {
  IngredientFormModal,
  AdjustStockModal,
} from "../../components/InventoryModals";

type FilterMode = "all" | "low";

const emptyForm = { name: "", stock: 0, unit: "", minStock: 0 };
const emptyAdjust = { qtyChange: 0, reason: "RESTOCK" as StockReason };

const getStockStatus = (item: Ingredient) => {
  if (item.stock <= 0) {
    return {
      key: "out" as const,
      label: "Stok Habis",
      badgeClass:
        "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300",
      rowClass: "bg-red-50/60 dark:bg-red-500/5",
      stockClass: "text-red-600",
    };
  }

  if (item.stock <= item.minStock) {
    return {
      key: "low" as const,
      label: "Stok Menipis",
      badgeClass:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300",
      rowClass: "bg-yellow-50/60 dark:bg-yellow-500/5",
      stockClass: "text-yellow-600",
    };
  }

  return {
    key: "safe" as const,
    label: "Aman",
    badgeClass:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
    rowClass: "",
    stockClass: "text-emerald-600",
  };
};

const isNeedsRestock = (item: Ingredient) => item.stock <= item.minStock;
const isOutOfStock = (item: Ingredient) => item.stock <= 0;
const isLowStockOnly = (item: Ingredient) =>
  item.stock > 0 && item.stock <= item.minStock;

export default function InventoryPage() {
  const router = useRouter();

  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Ingredient | null>(null);
  const [form, setForm] = useState(emptyForm);

  const [adjustOpen, setAdjustOpen] = useState(false);
  const [selected, setSelected] = useState<Ingredient | null>(null);
  const [adjustForm, setAdjustForm] = useState(emptyAdjust);

  const loadIngredients = async () => {
    try {
      setLoading(true);

      const data = await api.getIngredients();
      setIngredients(Array.isArray(data) ? data : []);
    } catch (error: any) {
      toast.error(error?.message || "Gagal mengambil data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIngredients();
  }, []);

  const filteredIngredients = useMemo(() => {
    return ingredients
      .filter((item) => {
        if (filterMode === "low") {
          return isNeedsRestock(item);
        }

        return true;
      })
      .filter((item) => {
        const keyword = search.toLowerCase();

        return (
          item.name.toLowerCase().includes(keyword) ||
          item.unit.toLowerCase().includes(keyword)
        );
      });
  }, [ingredients, filterMode, search]);

  const stats = useMemo(
    () => ({
      total: ingredients.length,
      out: ingredients.filter(isOutOfStock).length,
      low: ingredients.filter(isLowStockOnly).length,
      needsRestock: ingredients.filter(isNeedsRestock).length,
      safe: ingredients.filter((item) => !isNeedsRestock(item)).length,
    }),
    [ingredients]
  );

  const restockItems = useMemo(() => {
    return ingredients
      .filter(isNeedsRestock)
      .sort((a, b) => {
        const aStatus = getStockStatus(a).key;
        const bStatus = getStockStatus(b).key;

        if (aStatus === "out" && bStatus !== "out") return -1;
        if (aStatus !== "out" && bStatus === "out") return 1;

        return a.stock - b.stock;
      })
      .slice(0, 6);
  }, [ingredients]);

  const handleSaveIngredient = async (e: FormEvent) => {
    e.preventDefault();

    if (!form.name || !form.unit) {
      toast.error("Nama dan unit wajib diisi");
      return;
    }

    const toastId = toast.loading("Sedang menyimpan...");

    try {
      if (editing) {
        await api.updateIngredient(editing.id, form);
        toast.success("Bahan berhasil diupdate", { id: toastId });
      } else {
        await api.createIngredient(form);
        toast.success("Bahan berhasil ditambah", { id: toastId });
      }

      setFormOpen(false);
      setEditing(null);
      setForm(emptyForm);
      loadIngredients();
    } catch (error: any) {
      toast.error(error?.message || "Gagal menyimpan bahan", { id: toastId });
    }
  };

  const handleAdjustStock = async (e: FormEvent) => {
    e.preventDefault();

    if (!selected || adjustForm.qtyChange === 0) {
      toast.error("Jumlah tidak boleh 0");
      return;
    }

    let qty = adjustForm.qtyChange;

    if (adjustForm.reason === "RESTOCK") qty = Math.abs(qty);
    if (adjustForm.reason === "SPOIL") qty = -Math.abs(qty);

    const toastId = toast.loading("Memproses adjustment...");

    try {
      await api.adjustStock(selected.id, qty, adjustForm.reason);

      toast.success("Stok berhasil diperbarui", { id: toastId });
      setAdjustOpen(false);
      setSelected(null);
      setAdjustForm(emptyAdjust);
      loadIngredients();
    } catch (error: any) {
      toast.error(error?.message || "Gagal memperbarui stok", { id: toastId });
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-black text-kanovi-coffee dark:text-white flex items-center gap-3">
            <Package className="w-8 h-8 text-kanovi-wood" />
            Inventory System
          </h1>

          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Kelola ketersediaan stok bahan baku Kanovi secara real-time.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => router.push("/dashboard/stock-movements")}
            className="bg-kanovi-darker hover:bg-kanovi-coffee text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all"
          >
            <History className="w-5 h-5" />
            Riwayat Stok
          </button>

          <button
            type="button"
            onClick={() => {
              setEditing(null);
              setForm(emptyForm);
              setFormOpen(true);
            }}
            className="bg-kanovi-wood hover:opacity-90 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all"
          >
            <Plus className="w-5 h-5" />
            Tambah Bahan Baru
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Item",
            val: stats.total,
            color: "text-blue-600",
          },
          {
            label: "Stok Aman",
            val: stats.safe,
            color: "text-emerald-600",
          },
          {
            label: "Stok Menipis",
            val: stats.low,
            color: "text-yellow-600",
          },
          {
            label: "Stok Habis",
            val: stats.out,
            color: "text-red-600",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white dark:bg-kanovi-darker p-4 rounded-2xl border border-kanovi-cream/50 dark:border-white/5 shadow-sm"
          >
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              {s.label}
            </p>
            <p className={`text-2xl font-black mt-1 ${s.color}`}>{s.val}</p>
          </div>
        ))}
      </div>

      {stats.needsRestock > 0 && (
        <section className="mb-6 rounded-2xl border border-yellow-200 bg-yellow-50 p-4 shadow-sm dark:border-yellow-500/20 dark:bg-yellow-500/10">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-bold text-kanovi-coffee dark:text-kanovi-bone">
                Bahan Perlu Restock
              </h2>

              <p className="text-sm text-kanovi-coffee/70 dark:text-kanovi-cream/70">
                Ada {stats.needsRestock} bahan yang sudah mencapai atau melewati
                batas minimum stok.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setFilterMode("low")}
              className="w-fit rounded-xl bg-kanovi-wood px-4 py-2 text-sm font-bold text-white hover:opacity-90"
            >
              Lihat Low Stock Only
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {restockItems.map((item) => {
              const status = getStockStatus(item);

              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-white/70 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-kanovi-darker"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-kanovi-coffee dark:text-kanovi-bone">
                        {item.name}
                      </h3>

                      <p className="mt-1 text-xs text-kanovi-coffee/60 dark:text-kanovi-cream/60">
                        Min. stok: {item.minStock} {item.unit}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${status.badgeClass}`}
                    >
                      {status.label}
                    </span>
                  </div>

                  <div className="mt-4 flex items-end justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-kanovi-coffee/50 dark:text-kanovi-cream/50">
                        Sisa Stok
                      </p>

                      <p className="text-2xl font-black text-kanovi-coffee dark:text-kanovi-bone">
                        {item.stock}
                        <span className="ml-1 text-sm font-semibold opacity-70">
                          {item.unit}
                        </span>
                      </p>
                    </div>

                    <p className="text-xs text-kanovi-coffee/60 dark:text-kanovi-cream/60">
                      Perlu restock
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {stats.needsRestock === 0 && (
        <section className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/10">
          <h2 className="font-bold text-emerald-700 dark:text-emerald-300">
            Semua stok aman
          </h2>

          <p className="text-sm text-emerald-700/80 dark:text-emerald-300/80">
            Tidak ada bahan yang berada di bawah batas minimum.
          </p>
        </section>
      )}

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />

          <input
            type="text"
            placeholder="Cari nama bahan atau satuan (unit)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-kanovi-darker border border-kanovi-cream dark:border-white/10 rounded-xl focus:ring-2 focus:ring-kanovi-wood outline-none dark:text-white"
          />
        </div>

        <div className="flex bg-gray-100 dark:bg-kanovi-darker p-1 rounded-xl border border-kanovi-cream dark:border-white/10">
          {(["all", "low"] as FilterMode[]).map((mode) => {
            const label = mode === "all" ? "Semua" : "Low Stock Only";

            return (
              <button
                key={mode}
                type="button"
                onClick={() => setFilterMode(mode)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  filterMode === mode
                    ? "bg-white dark:bg-gray-700 shadow-sm text-kanovi-coffee dark:text-white"
                    : "text-gray-400"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-white dark:bg-kanovi-darker rounded-2xl border border-kanovi-cream/50 dark:border-white/5 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-kanovi-paper dark:bg-white/5 text-gray-500 text-xs font-bold uppercase tracking-widest">
                <th className="px-6 py-4">Nama Bahan</th>
                <th className="px-6 py-4">Sisa Stok</th>
                <th className="px-6 py-4">Satuan</th>
                <th className="px-6 py-4">Min. Stok</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-kanovi-cream/30 dark:divide-white/5">
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-gray-400"
                  >
                    Memuat data bahan baku...
                  </td>
                </tr>
              ) : filteredIngredients.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-gray-400"
                  >
                    {filterMode === "low"
                      ? "Tidak ada bahan low stock. Semua stok masih aman."
                      : "Tidak ada data ditemukan."}
                  </td>
                </tr>
              ) : (
                filteredIngredients.map((item) => {
                  const status = getStockStatus(item);

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${status.rowClass}`}
                    >
                      <td className="px-6 py-4 font-bold text-kanovi-coffee dark:text-gray-200">
                        {item.name}
                      </td>

                      <td className="px-6 py-4">
                        <span className={`text-lg font-black ${status.stockClass}`}>
                          {item.stock}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-gray-500">{item.unit}</td>

                      <td className="px-6 py-4 font-mono text-xs text-gray-400">
                        {item.minStock}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${status.badgeClass}`}
                        >
                          {status.label}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditing(item);
                              setForm({
                                name: item.name,
                                stock: item.stock,
                                unit: item.unit,
                                minStock: item.minStock,
                              });
                              setFormOpen(true);
                            }}
                            className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 rounded-lg transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setSelected(item);
                              setAdjustForm(emptyAdjust);
                              setAdjustOpen(true);
                            }}
                            className="bg-kanovi-wood/10 hover:bg-kanovi-wood text-kanovi-wood hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                          >
                            <Settings2 className="w-4 h-4" />
                            Adjust
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <IngredientFormModal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        editing={editing}
        form={form}
        setForm={setForm}
        onSave={handleSaveIngredient}
      />

      <AdjustStockModal
        isOpen={adjustOpen}
        onClose={() => setAdjustOpen(false)}
        selected={selected}
        adjustForm={adjustForm}
        setAdjustForm={setAdjustForm}
        onAdjust={handleAdjustStock}
      />
    </div>
  );
}