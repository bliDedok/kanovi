"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Search, Filter, Plus, Package, AlertCircle, Edit3, Settings2 } from "lucide-react";
import { api } from "../../../lib/api";
import { Ingredient, StockReason } from "../../../types";
import { IngredientFormModal, AdjustStockModal } from "../../components/InventoryModals";

type FilterMode = "all" | "low" | "minus";

const emptyForm = { name: "", stock: 0, unit: "", minStock: 0 };
const emptyAdjust = { qtyChange: 0, reason: "RESTOCK" as StockReason };

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

  const loadIngredients = async () => {
    try {
      setLoading(true);
      const data = await api.getIngredients();
      setIngredients(Array.isArray(data) ? data : []);
    } catch (error: any) {
      toast.error(error.message || "Gagal mengambil data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadIngredients(); }, []);

  const filteredIngredients = useMemo(() => {
    return ingredients.filter((item) => {
      if (filterMode === "low") return item.stock >= 0 && item.stock <= item.minStock;
      if (filterMode === "minus") return item.stock < 0;
      return true;
    }).filter((item) => {
      const keyword = search.toLowerCase();
      return item.name.toLowerCase().includes(keyword) || item.unit.toLowerCase().includes(keyword);
    });
  }, [ingredients, filterMode, search]);

  const handleSaveIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.unit) return toast.error("Nama dan unit wajib diisi");

    const toastId = toast.loading("Sedang menyimpan...");
    try {
      if (editing) {
        await api.updateIngredient(editing.id, form);
        toast.success("Bahan berhasil diupdate", { id: toastId });
      } else {
        await api.createIngredient(form);
        toast.success("Bahan berhasil ditambah", { id: toastId });
      }
      setFormOpen(false); setEditing(null); setForm(emptyForm);
      loadIngredients();
    } catch (error: any) {
      toast.error(error.message, { id: toastId });
    }
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || adjustForm.qtyChange === 0) return toast.error("Jumlah tidak boleh 0");

    let qty = adjustForm.qtyChange;
    if (adjustForm.reason === "RESTOCK") qty = Math.abs(qty);
    if (adjustForm.reason === "SPOIL") qty = -Math.abs(qty);

    const toastId = toast.loading("Memproses adjustment...");
    try {
      await api.adjustStock(selected.id, qty, adjustForm.reason);
      toast.success("Stok berhasil diperbarui", { id: toastId });
      setAdjustOpen(false); setSelected(null); setAdjustForm(emptyAdjust);
      loadIngredients();
    } catch (error: any) {
      toast.error(error.message, { id: toastId });
    }
  };

  const stats = {
    minus: ingredients.filter(i => i.stock < 0).length,
    low: ingredients.filter(i => i.stock >= 0 && i.stock <= i.minStock).length
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-black text-kanovi-coffee dark:text-white flex items-center gap-3">
            <Package className="w-8 h-8 text-kanovi-wood" /> Inventory System
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Kelola ketersediaan stok bahan baku Kanovi secara real-time.</p>
        </div>
        <button onClick={() => { setEditing(null); setForm(emptyForm); setFormOpen(true); }} className="bg-kanovi-wood hover:opacity-90 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all">
          <Plus className="w-5 h-5" /> Tambah Bahan Baru
        </button>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Item", val: ingredients.length, color: "text-blue-600" },
          { label: "Stok Aman", val: ingredients.length - stats.minus - stats.low, color: "text-green-600" },
          { label: "Low Stock", val: stats.low, color: "text-yellow-600" },
          { label: "Stok Minus", val: stats.minus, color: "text-red-600" },
        ].map((s, i) => (
          <div key={i} className="bg-white dark:bg-kanovi-darker p-4 rounded-2xl border border-kanovi-cream/50 dark:border-white/5 shadow-sm">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{s.label}</p>
            <p className={`text-2xl font-black mt-1 ${s.color}`}>{s.val}</p>
          </div>
        ))}
      </div>

      {/* Alert Minus */}
      {stats.minus > 0 && (
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 p-4 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <p className="text-sm text-red-800 dark:text-red-300">
            Terdapat <b>{stats.minus} item</b> dengan stok minus. Segera lakukan adjustment stok fisik untuk sinkronisasi data.
          </p>
        </div>
      )}

      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Cari nama bahan atau satuan (unit)..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-kanovi-darker border border-kanovi-cream dark:border-white/10 rounded-xl focus:ring-2 focus:ring-kanovi-wood outline-none dark:text-white" />
        </div>
        <div className="flex bg-gray-100 dark:bg-kanovi-darker p-1 rounded-xl border border-kanovi-cream dark:border-white/10">
          {(['all', 'low', 'minus'] as FilterMode[]).map((m) => (
            <button key={m} onClick={() => setFilterMode(m)} className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all ${filterMode === m ? 'bg-white dark:bg-gray-700 shadow-sm text-kanovi-coffee dark:text-white' : 'text-gray-400'}`}>
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white dark:bg-kanovi-darker rounded-2xl border border-kanovi-cream/50 dark:border-white/5 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-kanovi-paper dark:bg-white/5 text-gray-500 text-xs font-bold uppercase tracking-widest">
                <th className="px-6 py-4">Nama Bahan</th>
                <th className="px-6 py-4">Sisa Stok</th>
                <th className="px-6 py-4">Satuan</th>
                <th className="px-6 py-4">Min. Stok</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-kanovi-cream/30 dark:divide-white/5">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">Memuat data bahan baku...</td></tr>
              ) : filteredIngredients.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">Tidak ada data ditemukan.</td></tr>
              ) : (
                filteredIngredients.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-bold text-kanovi-coffee dark:text-gray-200">{item.name}</td>
                    <td className="px-6 py-4">
                      <span className={`text-lg font-black ${item.stock < 0 ? 'text-red-500' : item.stock <= item.minStock ? 'text-yellow-600' : 'text-green-600'}`}>
                        {item.stock}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{item.unit}</td>
                    <td className="px-6 py-4 font-mono text-xs text-gray-400">{item.minStock}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => { setEditing(item); setForm({ name: item.name, stock: item.stock, unit: item.unit, minStock: item.minStock }); setFormOpen(true); }} className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 rounded-lg transition-colors"><Edit3 className="w-4 h-4" /></button>
                        <button onClick={() => { setSelected(item); setAdjustForm(emptyAdjust); setAdjustOpen(true); }} className="bg-kanovi-wood/10 hover:bg-kanovi-wood text-kanovi-wood hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1"><Settings2 className="w-4 h-4" /> Adjust</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Render Modals */}
      <IngredientFormModal isOpen={formOpen} onClose={() => setFormOpen(false)} editing={editing} form={form} setForm={setForm} onSave={handleSaveIngredient} />
      <AdjustStockModal isOpen={adjustOpen} onClose={() => setAdjustOpen(false)} selected={selected} adjustForm={adjustForm} setAdjustForm={setAdjustForm} onAdjust={handleAdjustStock} />
    </div>
  );
}