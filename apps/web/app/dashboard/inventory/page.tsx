"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

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
      className: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300",
    };
  }

  if (item.stock <= item.minStock) {
    return {
      label: "Low Stock",
      className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300",
    };
  }

  return {
    label: "Aman",
    className: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300",
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
    toast.error(error instanceof Error ? error.message : "Gagal mengambil ingredient");
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

    const toastId = toast.loading(editing ? "Menyimpan perubahan..." : "Menambah ingredient...");

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
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan ingredient", {
        id: toastId,
      });
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
  

  return (
    
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-kanovi-coffee dark:text-kanovi-cream">
            Inventory
          </h1>
          {minusCount > 0 && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"> 
            Ada <span className="font-semibold">{minusCount}</span> ingredient dengan stok minus. Ini biasanya terjadi karena override saat penjualan. Segera cek stok riil dan lakukan penyesuaian.
            </div>
        )}
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Kelola bahan baku, batas minimum stok, dan adjustment stok.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="rounded-lg bg-kanovi-wood px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          + Tambah Ingredient
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-kanovi-cream bg-white p-4 dark:border-white/10 dark:bg-kanovi-darker">
            <p className="text-sm text-gray-500">Total item</p>
            <p className="mt-1 text-2xl font-bold">{ingredients.length}</p>
        </div>

        <div className="rounded-xl border border-kanovi-cream bg-white p-4 dark:border-white/10 dark:bg-kanovi-darker">
            <p className="text-sm text-gray-500">Mode filter</p>
            <p className="mt-1 text-2xl font-bold">
            {filterMode === "all" ? "Semua" : filterMode === "low" ? "Low Stock" : "Minus"}
            </p>
        </div>

        <div className="rounded-xl border border-kanovi-cream bg-white p-4 dark:border-white/10 dark:bg-kanovi-darker">
            <p className="text-sm text-gray-500">Low stock</p>
            <p className="mt-1 text-2xl font-bold">{lowStockCount}</p>
        </div>

        <div className="rounded-xl border border-kanovi-cream bg-white p-4 dark:border-white/10 dark:bg-kanovi-darker">
            <p className="text-sm text-gray-500">Stok minus</p>
            <p className="mt-1 text-2xl font-bold text-red-600 dark:text-red-300">{minusCount}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <input
          type="text"
          placeholder="Cari ingredient atau unit..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-kanovi-cream bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-kanovi-wood dark:border-white/10 dark:bg-kanovi-darker md:max-w-md"
        />

        <div className="flex gap-2">
          <button
            onClick={() => setFilterMode("all")}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              filterMode === "all"
                ? "bg-kanovi-wood text-white"
                : "bg-white text-kanovi-coffee border border-kanovi-cream dark:bg-kanovi-darker dark:border-white/10 dark:text-kanovi-cream"
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setFilterMode("low")}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              filterMode === "low"
                ? "bg-kanovi-wood text-white"
                : "bg-white text-kanovi-coffee border border-kanovi-cream dark:bg-kanovi-darker dark:border-white/10 dark:text-kanovi-cream"
            }`}
          >
            Low Stock
          </button>
          <button
            onClick={() => setFilterMode("minus")}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              filterMode === "minus"
                ? "bg-kanovi-wood text-white"
                : "bg-white text-kanovi-coffee border border-kanovi-cream dark:bg-kanovi-darker dark:border-white/10 dark:text-kanovi-cream"
            }`}
          >
            Minus
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-kanovi-cream bg-white dark:border-white/10 dark:bg-kanovi-darker">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-kanovi-paper dark:bg-white/5">
              <tr className="text-left">
                <th className="px-4 py-3">Nama</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Unit</th>
                <th className="px-4 py-3">Min Stock</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    Memuat data...
                  </td>
                </tr>
              ) : filteredIngredients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    Belum ada data ingredient.
                  </td>
                </tr>
              ) : (
                filteredIngredients.map((item) => (
                  <tr key={item.id} className="border-t border-kanovi-cream/70 dark:border-white/10">
                    <td className="px-4 py-3 font-medium">{item.name}</td>
                    <td className={`px-4 py-3 font-medium ${ item.stock < 0 ? "text-red-600 dark:text-red-300" : ""}`}> {item.stock} </td>
                    <td className="px-4 py-3">{item.unit}</td>
                    <td className="px-4 py-3">{item.minStock}</td>
                    <td className="px-4 py-3">
                      {(() => {
                            const status = getStockStatus(item);
                            return (
                                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}>
                                {status.label}
                                </span>
                            );
                        })()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditModal(item)}
                          className="rounded-md bg-kanovi-cream/60 px-3 py-1.5 text-xs font-medium hover:bg-kanovi-cream dark:bg-white/10 dark:hover:bg-white/20"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => openAdjustModal(item)}
                          className="rounded-md bg-kanovi-wood px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
                        >
                          Adjust
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-kanovi-darker">
            <h2 className="text-xl font-bold">{editing ? "Edit Ingredient" : "Tambah Ingredient"}</h2>
            <form onSubmit={handleSaveIngredient} className="mt-4 space-y-4">
              <input
                type="text"
                placeholder="Nama ingredient"
                value={form.name}
                onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                className="w-full rounded-lg border px-4 py-2 dark:bg-transparent"
              />
              <div className="grid gap-4 md:grid-cols-2">
                <input
                  type="number"
                  placeholder="Stock"
                  value={form.stock}
                  onChange={(e) => setForm((s) => ({ ...s, stock: Number(e.target.value) }))}
                  className="w-full rounded-lg border px-4 py-2 dark:bg-transparent"
                />
                <input
                  type="text"
                  placeholder="Unit"
                  value={form.unit}
                  onChange={(e) => setForm((s) => ({ ...s, unit: e.target.value }))}
                  className="w-full rounded-lg border px-4 py-2 dark:bg-transparent"
                />
              </div>
              <input
                type="number"
                placeholder="Minimum stock"
                value={form.minStock}
                onChange={(e) => setForm((s) => ({ ...s, minStock: Number(e.target.value) }))}
                className="w-full rounded-lg border px-4 py-2 dark:bg-transparent"
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="rounded-lg border px-4 py-2"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-kanovi-wood px-4 py-2 font-medium text-white"
                >
                  {editing ? "Simpan" : "Tambah"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {adjustOpen && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-kanovi-darker">
            <h2 className="text-xl font-bold">Adjust Stok</h2>
            <p className="mt-1 text-sm text-gray-500">
              {selected.name} • stok sekarang: {selected.stock} {selected.unit}
            </p>

            <form onSubmit={handleAdjustStock} className="mt-4 space-y-4">
              <select
                value={adjustForm.reason}
                onChange={(e) =>
                  setAdjustForm((s) => ({ ...s, reason: e.target.value as Reason }))
                }
                className="w-full rounded-lg border px-4 py-2 dark:bg-transparent"
              >
                <option value="RESTOCK">RESTOCK</option>
                <option value="ADJUSTMENT">ADJUSTMENT</option>
                <option value="SPOIL">SPOIL</option>
              </select>

              <input
                type="number"
                value={adjustForm.qtyChange}
                onChange={(e) =>
                  setAdjustForm((s) => ({ ...s, qtyChange: Number(e.target.value) }))
                }
                placeholder="qtyChange"
                className="w-full rounded-lg border px-4 py-2 dark:bg-transparent"
              />

              <p className="text-xs text-gray-500">
                RESTOCK otomatis dibuat positif. SPOIL otomatis dibuat negatif.
              </p>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustOpen(false)}
                  className="rounded-lg border px-4 py-2"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-kanovi-wood px-4 py-2 font-medium text-white"
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