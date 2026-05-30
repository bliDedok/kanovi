"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  AlertTriangle,
  Boxes,
  Edit3,
  Plus,
  Search,
  SlidersHorizontal,
  TrendingDown,
} from "lucide-react";

type Reason = "RESTOCK" | "ADJUSTMENT" | "SPOIL";
type FilterMode = "all" | "low" | "minus";

type Ingredient = {
  id: number;
  name: string;
  stock: number;
  unit: string;
  minStock: number;
  isLowStock?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3001";

function getToken() {
  if (typeof document === "undefined") return "";
  return (
    document.cookie
      .split("; ")
      .find((row) => row.startsWith("kanovi_token="))
      ?.split("=")[1] ?? ""
  );
}

async function apiFetch(path: string, init: RequestInit = {}) {
  const token = getToken();

  const headers: HeadersInit = {
    Authorization: `Bearer ${token}`,
    ...(init.body ? { "Content-Type": "application/json" } : {}),
    ...(init.headers ?? {}),
  };

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.message || data?.detail || "Request gagal");
  }

  return data;
}

const emptyForm = {
  name: "",
  stock: 0,
  unit: "",
  minStock: 0,
};

const emptyAdjust = {
  qtyChange: 0,
  reason: "RESTOCK" as Reason,
};

function getStockStatus(item: Ingredient) {
  if (item.stock < 0) {
    return {
      label: `Minus (${item.stock})`,
      className: "bg-red-500/10 text-red-600 dark:text-red-300",
    };
  }

  if (item.stock <= item.minStock) {
    return {
      label: "Low Stock",
      className: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-300",
    };
  }

  return {
    label: "Aman",
    className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
  };
}

export default function InventoryPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Ingredient | null>(null);
  const [form, setForm] = useState(emptyForm);

  const [adjustOpen, setAdjustOpen] = useState(false);
  const [selected, setSelected] = useState<Ingredient | null>(null);
  const [adjustForm, setAdjustForm] = useState(emptyAdjust);

  async function loadIngredients() {
    try {
      setLoading(true);
      const data = await apiFetch("/api/ingredients");
      setIngredients(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal mengambil ingredient"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadIngredients();
  }, []);

  const filteredIngredients = useMemo(() => {
    return ingredients
      .filter((item) => {
        if (filterMode === "low") {
          return item.stock >= 0 && item.stock <= item.minStock;
        }

        if (filterMode === "minus") {
          return item.stock < 0;
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

  function openCreateModal() {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  }

  function openEditModal(item: Ingredient) {
    setEditing(item);
    setForm({
      name: item.name,
      stock: item.stock,
      unit: item.unit,
      minStock: item.minStock,
    });
    setFormOpen(true);
  }

  function openAdjustModal(item: Ingredient) {
    setSelected(item);
    setAdjustForm({
      qtyChange: 0,
      reason: "RESTOCK",
    });
    setAdjustOpen(true);
  }

  async function handleSaveIngredient(e: React.FormEvent) {
    e.preventDefault();

    const payload = {
      name: form.name.trim(),
      stock: Number(form.stock),
      unit: form.unit.trim(),
      minStock: Number(form.minStock),
    };

    if (!payload.name || !payload.unit) {
      toast.error("Nama dan unit wajib diisi");
      return;
    }

    const toastId = toast.loading(
      editing ? "Menyimpan perubahan..." : "Menambah ingredient..."
    );

    try {
      if (editing) {
        await apiFetch(`/api/ingredients/${editing.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        toast.success("Ingredient berhasil diupdate", { id: toastId });
      } else {
        await apiFetch("/api/ingredients", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.success("Ingredient berhasil ditambahkan", { id: toastId });
      }

      setFormOpen(false);
      setEditing(null);
      setForm(emptyForm);
      await loadIngredients();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal menyimpan ingredient",
        { id: toastId }
      );
    }
  }

  async function handleAdjustStock(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;

    let qtyChange = Number(adjustForm.qtyChange);

    if (adjustForm.reason === "RESTOCK" && qtyChange < 0) {
      qtyChange = Math.abs(qtyChange);
    }

    if (adjustForm.reason === "SPOIL" && qtyChange > 0) {
      qtyChange = -qtyChange;
    }

    if (qtyChange === 0) {
      toast.error("qtyChange tidak boleh 0");
      return;
    }

    const toastId = toast.loading("Mengadjust stok...");

    try {
      await apiFetch(`/api/ingredients/${selected.id}/adjust`, {
        method: "POST",
        body: JSON.stringify({
          qtyChange,
          reason: adjustForm.reason,
        }),
      });

      toast.success("Stok berhasil diadjust", { id: toastId });
      setAdjustOpen(false);
      setSelected(null);
      setAdjustForm(emptyAdjust);
      await loadIngredients();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal adjust stok", {
        id: toastId,
      });
    }
  }

  const minusCount = ingredients.filter((item) => item.stock < 0).length;
  const lowStockCount = ingredients.filter(
    (item) => item.stock >= 0 && item.stock <= item.minStock
  ).length;

  const fieldClass =
    "w-full rounded-2xl bg-[#edf2f4] px-4 py-3 text-sm font-bold text-[#20272c] shadow-[inset_6px_6px_12px_rgba(130,145,152,0.20),inset_-6px_-6px_12px_rgba(255,255,255,0.92)] outline-none placeholder:text-[#8a969c] dark:bg-white/[0.06] dark:text-white dark:shadow-[inset_6px_6px_12px_rgba(0,0,0,0.28),inset_-6px_-6px_12px_rgba(255,255,255,0.035)] dark:placeholder:text-white/35";

  const softButtonClass =
    "rounded-2xl bg-[#edf2f4] px-4 py-3 text-sm font-black text-[#20272c] shadow-[7px_7px_16px_rgba(130,145,152,0.18),-7px_-7px_16px_rgba(255,255,255,0.9)] transition-all active:shadow-[inset_5px_5px_10px_rgba(130,145,152,0.22),inset_-5px_-5px_10px_rgba(255,255,255,0.9)] dark:bg-white/[0.07] dark:text-white dark:shadow-[7px_7px_16px_rgba(0,0,0,0.26),-4px_-4px_12px_rgba(255,255,255,0.03)] dark:active:shadow-[inset_5px_5px_10px_rgba(0,0,0,0.28),inset_-5px_-5px_10px_rgba(255,255,255,0.035)]";

  const activeFilterClass =
    "rounded-2xl bg-[#edf2f4] px-4 py-3 text-sm font-black text-[#2b65d9] shadow-[inset_6px_6px_12px_rgba(130,145,152,0.22),inset_-6px_-6px_12px_rgba(255,255,255,0.92)] dark:bg-white/[0.08] dark:text-[#FFD28A] dark:shadow-[inset_6px_6px_12px_rgba(0,0,0,0.28),inset_-6px_-6px_12px_rgba(255,255,255,0.035)]";

  return (
    <div className="mx-auto w-full max-w-6xl animate-fade-in space-y-6">
      <section className="rounded-[2.2rem] border border-white/70 bg-[#edf2f4] p-6 shadow-[18px_18px_42px_rgba(130,145,152,0.20),-14px_-14px_34px_rgba(255,255,255,0.92)] dark:border-white/10 dark:bg-white/[0.055] dark:shadow-[18px_18px_42px_rgba(0,0,0,0.32),-8px_-8px_24px_rgba(255,255,255,0.035)] md:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>

            <h1 className="text-3xl font-black tracking-tight text-[#20272c] dark:text-[#f7efe7] md:text-4xl">
              Inventory
            </h1>

            <p className="mt-3 max-w-2xl text-sm font-semibold leading-relaxed text-[#6f7a80] dark:text-white/55 md:text-base">
              Kelola bahan baku, batas minimum stok, dan adjustment stok.
            </p>
          </div>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#edf2f4] px-5 py-3 text-sm font-black text-[#20272c] shadow-[8px_8px_18px_rgba(130,145,152,0.2),-8px_-8px_18px_rgba(255,255,255,0.95)] transition-all hover:-translate-y-0.5 active:translate-y-0 active:shadow-[inset_5px_5px_10px_rgba(130,145,152,0.22),inset_-5px_-5px_10px_rgba(255,255,255,0.92)] dark:bg-white/[0.07] dark:text-white dark:shadow-[8px_8px_18px_rgba(0,0,0,0.28),-5px_-5px_14px_rgba(255,255,255,0.035)] dark:active:shadow-[inset_5px_5px_10px_rgba(0,0,0,0.28),inset_-5px_-5px_10px_rgba(255,255,255,0.035)]"
          >
            <Plus className="h-5 w-5" />
            Tambah Ingredient
          </button>
        </div>

        {minusCount > 0 && (
          <div className="mt-5 rounded-[1.5rem] bg-[#edf2f4] px-4 py-3 text-sm font-bold text-red-600 shadow-[inset_6px_6px_12px_rgba(130,145,152,0.18),inset_-6px_-6px_12px_rgba(255,255,255,0.9)] dark:bg-white/[0.06] dark:text-red-300 dark:shadow-[inset_6px_6px_12px_rgba(0,0,0,0.25),inset_-6px_-6px_12px_rgba(255,255,255,0.035)]">
            <span className="inline-flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Ada <span className="font-black">{minusCount}</span> ingredient
              dengan stok minus. Segera cek stok riil dan lakukan penyesuaian.
            </span>
          </div>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-[1.8rem] bg-[#edf2f4] p-5 shadow-[12px_12px_28px_rgba(130,145,152,0.18),-10px_-10px_24px_rgba(255,255,255,0.92)] dark:bg-white/[0.055] dark:shadow-[12px_12px_28px_rgba(0,0,0,0.28),-6px_-6px_18px_rgba(255,255,255,0.035)]">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8a969c] dark:text-white/40">
            Total item
          </p>
          <p className="mt-2 text-3xl font-black">{ingredients.length}</p>
        </div>

        <div className="rounded-[1.8rem] bg-[#edf2f4] p-5 shadow-[12px_12px_28px_rgba(130,145,152,0.18),-10px_-10px_24px_rgba(255,255,255,0.92)] dark:bg-white/[0.055] dark:shadow-[12px_12px_28px_rgba(0,0,0,0.28),-6px_-6px_18px_rgba(255,255,255,0.035)]">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8a969c] dark:text-white/40">
            Mode filter
          </p>
          <p className="mt-2 text-2xl font-black">
            {filterMode === "all"
              ? "Semua"
              : filterMode === "low"
                ? "Low Stock"
                : "Minus"}
          </p>
        </div>

        <div className="rounded-[1.8rem] bg-[#edf2f4] p-5 shadow-[12px_12px_28px_rgba(130,145,152,0.18),-10px_-10px_24px_rgba(255,255,255,0.92)] dark:bg-white/[0.055] dark:shadow-[12px_12px_28px_rgba(0,0,0,0.28),-6px_-6px_18px_rgba(255,255,255,0.035)]">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8a969c] dark:text-white/40">
            Low stock
          </p>
          <p className="mt-2 text-3xl font-black">{lowStockCount}</p>
        </div>

        <div className="rounded-[1.8rem] bg-[#edf2f4] p-5 shadow-[inset_7px_7px_14px_rgba(130,145,152,0.20),inset_-7px_-7px_14px_rgba(255,255,255,0.92)] dark:bg-white/[0.055] dark:shadow-[inset_7px_7px_14px_rgba(0,0,0,0.28),inset_-7px_-7px_14px_rgba(255,255,255,0.035)]">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8a969c] dark:text-white/40">
            Stok minus
          </p>
          <p className="mt-2 text-3xl font-black text-red-500 dark:text-red-300">
            {minusCount}
          </p>
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-[2rem] bg-[#edf2f4] p-4 shadow-[12px_12px_28px_rgba(130,145,152,0.18),-10px_-10px_24px_rgba(255,255,255,0.92)] dark:bg-white/[0.055] dark:shadow-[12px_12px_28px_rgba(0,0,0,0.28),-6px_-6px_18px_rgba(255,255,255,0.035)] md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8a969c] dark:text-white/40" />
          <input
            type="text"
            placeholder="Cari ingredient atau unit..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${fieldClass} pl-12`}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterMode("all")}
            className={filterMode === "all" ? activeFilterClass : softButtonClass}
          >
            Semua
          </button>

          <button
            onClick={() => setFilterMode("low")}
            className={filterMode === "low" ? activeFilterClass : softButtonClass}
          >
            Low Stock
          </button>

          <button
            onClick={() => setFilterMode("minus")}
            className={
              filterMode === "minus" ? activeFilterClass : softButtonClass
            }
          >
            Minus
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-[2.2rem] bg-[#edf2f4] p-3 shadow-[18px_18px_42px_rgba(130,145,152,0.20),-14px_-14px_34px_rgba(255,255,255,0.92)] dark:bg-white/[0.055] dark:shadow-[18px_18px_42px_rgba(0,0,0,0.32),-8px_-8px_24px_rgba(255,255,255,0.035)]">
        <div className="overflow-x-auto rounded-[1.7rem] bg-[#edf2f4] shadow-[inset_7px_7px_14px_rgba(130,145,152,0.16),inset_-7px_-7px_14px_rgba(255,255,255,0.88)] dark:bg-white/[0.035] dark:shadow-[inset_7px_7px_14px_rgba(0,0,0,0.24),inset_-7px_-7px_14px_rgba(255,255,255,0.03)]">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm font-bold">
            <thead>
              <tr className="text-xs font-black uppercase tracking-[0.18em] text-[#7a858b] dark:text-white/40">
                <th className="px-5 py-5">Nama</th>
                <th className="px-5 py-5">Stock</th>
                <th className="px-5 py-5">Unit</th>
                <th className="px-5 py-5">Min Stock</th>
                <th className="px-5 py-5">Status</th>
                <th className="px-5 py-5">Aksi</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-[#8a969c] dark:text-white/40"
                  >
                    Memuat data...
                  </td>
                </tr>
              ) : filteredIngredients.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-[#8a969c] dark:text-white/40"
                  >
                    Belum ada data ingredient.
                  </td>
                </tr>
              ) : (
                filteredIngredients.map((item) => {
                  const status = getStockStatus(item);

                  return (
                    <tr
                      key={item.id}
                      className="border-t border-white/50 transition-colors hover:bg-white/30 dark:border-white/5 dark:hover:bg-white/[0.035]"
                    >
                      <td className="px-5 py-4 text-[#20272c] dark:text-[#f7efe7]">
                        {item.name}
                      </td>

                      <td
                        className={`px-5 py-4 ${
                          item.stock < 0
                            ? "text-red-500 dark:text-red-300"
                            : "text-[#20272c] dark:text-[#f7efe7]"
                        }`}
                      >
                        {item.stock}
                      </td>

                      <td className="px-5 py-4 text-[#6f7a80] dark:text-white/50">
                        {item.unit}
                      </td>

                      <td className="px-5 py-4 text-[#6f7a80] dark:text-white/50">
                        {item.minStock}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-black ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditModal(item)}
                            className="inline-flex items-center gap-2 rounded-xl bg-[#edf2f4] px-3 py-2 text-xs font-black text-[#20272c] shadow-[5px_5px_11px_rgba(130,145,152,0.18),-5px_-5px_11px_rgba(255,255,255,0.9)] transition-all active:shadow-[inset_4px_4px_8px_rgba(130,145,152,0.22),inset_-4px_-4px_8px_rgba(255,255,255,0.9)] dark:bg-white/[0.07] dark:text-white dark:shadow-[5px_5px_11px_rgba(0,0,0,0.24),-3px_-3px_9px_rgba(255,255,255,0.03)]"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                            Edit
                          </button>

                          <button
                            onClick={() => openAdjustModal(item)}
                            className="inline-flex items-center gap-2 rounded-xl bg-[#edf2f4] px-3 py-2 text-xs font-black text-[#20272c] shadow-[5px_5px_11px_rgba(130,145,152,0.18),-5px_-5px_11px_rgba(255,255,255,0.9)] transition-all active:shadow-[inset_4px_4px_8px_rgba(130,145,152,0.22),inset_-4px_-4px_8px_rgba(255,255,255,0.9)] dark:bg-white/[0.07] dark:text-white dark:shadow-[5px_5px_11px_rgba(0,0,0,0.24),-3px_-3px_9px_rgba(255,255,255,0.03)]"
                          >
                            <SlidersHorizontal className="h-3.5 w-3.5" />
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
      </section>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[2rem] bg-[#edf2f4] p-6 shadow-[22px_22px_52px_rgba(0,0,0,0.28),-12px_-12px_30px_rgba(255,255,255,0.30)] dark:bg-[#2f1a13] dark:shadow-[22px_22px_52px_rgba(0,0,0,0.45),-7px_-7px_20px_rgba(255,255,255,0.035)]">
            <h2 className="text-2xl font-black text-[#20272c] dark:text-[#f7efe7]">
              {editing ? "Edit Ingredient" : "Tambah Ingredient"}
            </h2>

            <form onSubmit={handleSaveIngredient} className="mt-6 space-y-4">
              <input
                type="text"
                placeholder="Nama ingredient"
                value={form.name}
                onChange={(e) =>
                  setForm((state) => ({ ...state, name: e.target.value }))
                }
                className={fieldClass}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <input
                  type="number"
                  placeholder="Stock"
                  value={form.stock}
                  onChange={(e) =>
                    setForm((state) => ({
                      ...state,
                      stock: Number(e.target.value),
                    }))
                  }
                  className={fieldClass}
                />

                <input
                  type="text"
                  placeholder="Unit"
                  value={form.unit}
                  onChange={(e) =>
                    setForm((state) => ({ ...state, unit: e.target.value }))
                  }
                  className={fieldClass}
                />
              </div>

              <input
                type="number"
                placeholder="Minimum stock"
                value={form.minStock}
                onChange={(e) =>
                  setForm((state) => ({
                    ...state,
                    minStock: Number(e.target.value),
                  }))
                }
                className={fieldClass}
              />

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className={softButtonClass}
                >
                  Batal
                </button>

                <button
                  type="submit"
                  className="rounded-2xl bg-[#20272c] px-5 py-3 text-sm font-black text-white transition-all active:scale-[0.98] dark:bg-white dark:text-[#311B14]"
                >
                  {editing ? "Simpan" : "Tambah"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {adjustOpen && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[2rem] bg-[#edf2f4] p-6 shadow-[22px_22px_52px_rgba(0,0,0,0.28),-12px_-12px_30px_rgba(255,255,255,0.30)] dark:bg-[#2f1a13] dark:shadow-[22px_22px_52px_rgba(0,0,0,0.45),-7px_-7px_20px_rgba(255,255,255,0.035)]">
            <div className="mb-5 flex items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf2f4] text-[#20272c] shadow-[inset_5px_5px_10px_rgba(130,145,152,0.2),inset_-5px_-5px_10px_rgba(255,255,255,0.9)] dark:bg-white/[0.07] dark:text-[#FFD28A] dark:shadow-[inset_5px_5px_10px_rgba(0,0,0,0.28),inset_-5px_-5px_10px_rgba(255,255,255,0.035)]">
                <TrendingDown className="h-6 w-6" />
              </div>

              <div>
                <h2 className="text-2xl font-black text-[#20272c] dark:text-[#f7efe7]">
                  Adjust Stok
                </h2>

                <p className="mt-1 text-sm font-semibold text-[#6f7a80] dark:text-white/50">
                  {selected.name} • stok sekarang: {selected.stock}{" "}
                  {selected.unit}
                </p>
              </div>
            </div>

            <form onSubmit={handleAdjustStock} className="space-y-4">
              <select
                value={adjustForm.reason}
                onChange={(e) =>
                  setAdjustForm((state) => ({
                    ...state,
                    reason: e.target.value as Reason,
                  }))
                }
                className={fieldClass}
              >
                <option value="RESTOCK">RESTOCK</option>
                <option value="ADJUSTMENT">ADJUSTMENT</option>
                <option value="SPOIL">SPOIL</option>
              </select>

              <input
                type="number"
                value={adjustForm.qtyChange}
                onChange={(e) =>
                  setAdjustForm((state) => ({
                    ...state,
                    qtyChange: Number(e.target.value),
                  }))
                }
                placeholder="qtyChange"
                className={fieldClass}
              />

              <p className="rounded-[1.3rem] bg-[#edf2f4] px-4 py-3 text-xs font-bold text-[#6f7a80] shadow-[inset_4px_4px_9px_rgba(130,145,152,0.16),inset_-4px_-4px_9px_rgba(255,255,255,0.88)] dark:bg-white/[0.055] dark:text-white/45 dark:shadow-[inset_4px_4px_9px_rgba(0,0,0,0.24),inset_-4px_-4px_9px_rgba(255,255,255,0.03)]">
                RESTOCK otomatis dibuat positif. SPOIL otomatis dibuat negatif.
              </p>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustOpen(false)}
                  className={softButtonClass}
                >
                  Batal
                </button>

                <button
                  type="submit"
                  className="rounded-2xl bg-[#20272c] px-5 py-3 text-sm font-black text-white transition-all active:scale-[0.98] dark:bg-white dark:text-[#311B14]"
                >
                  Simpan Adjust
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}