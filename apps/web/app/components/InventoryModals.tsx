import { Ingredient, StockReason } from "../../types";

// 1. MODAL TAMBAH/EDIT INGREDIENT
export function IngredientFormModal({ 
  isOpen, onClose, editing, form, setForm, onSave 
}: { 
  isOpen: boolean, onClose: () => void, editing: any, form: any, setForm: any, onSave: (e: React.FormEvent) => void 
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-kanovi-darker border border-kanovi-cream/50 dark:border-white/10">
        <h2 className="text-xl font-bold text-kanovi-coffee dark:text-white">
          {editing ? "Edit Ingredient" : "Tambah Ingredient"}
        </h2>
        <form onSubmit={onSave} className="mt-4 space-y-4">
          <input type="text" placeholder="Nama ingredient" value={form.name} onChange={(e) => setForm((s: any) => ({ ...s, name: e.target.value }))} className="w-full rounded-lg border border-kanovi-cream dark:border-white/10 p-2 dark:bg-transparent dark:text-white" required />
          <div className="grid gap-4 md:grid-cols-2">
            <input type="number" placeholder="Stock Awal" value={form.stock} onChange={(e) => setForm((s: any) => ({ ...s, stock: Number(e.target.value) }))} className="w-full rounded-lg border border-kanovi-cream dark:border-white/10 p-2 dark:bg-transparent dark:text-white" required />
            <input type="text" placeholder="Unit (Cth: gram, ml, pcs)" value={form.unit} onChange={(e) => setForm((s: any) => ({ ...s, unit: e.target.value }))} className="w-full rounded-lg border border-kanovi-cream dark:border-white/10 p-2 dark:bg-transparent dark:text-white" required />
          </div>
          <input type="number" placeholder="Minimum stock untuk peringatan" value={form.minStock} onChange={(e) => setForm((s: any) => ({ ...s, minStock: Number(e.target.value) }))} className="w-full rounded-lg border border-kanovi-cream dark:border-white/10 p-2 dark:bg-transparent dark:text-white" required />

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5">Batal</button>
            <button type="submit" className="rounded-lg bg-kanovi-wood px-6 py-2 font-bold text-white hover:opacity-90">
              {editing ? "Simpan Perubahan" : "Tambah Bahan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 2. MODAL ADJUST STOK
export function AdjustStockModal({
  isOpen, onClose, selected, adjustForm, setAdjustForm, onAdjust
}: {
  isOpen: boolean, onClose: () => void, selected: Ingredient | null, adjustForm: any, setAdjustForm: any, onAdjust: (e: React.FormEvent) => void
}) {
  if (!isOpen || !selected) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-kanovi-darker border border-kanovi-cream/50 dark:border-white/10">
        <h2 className="text-xl font-bold text-kanovi-coffee dark:text-white">Adjust Stok</h2>
        <p className="mt-1 text-sm text-gray-500">
          {selected.name} • Stok saat ini: <span className="font-bold text-kanovi-wood">{selected.stock} {selected.unit}</span>
        </p>

        <form onSubmit={onAdjust} className="mt-4 space-y-4">
          <div>
            <label className="text-xs font-bold uppercase text-gray-400">Alasan Perubahan</label>
            <select value={adjustForm.reason} onChange={(e) => setAdjustForm((s: any) => ({ ...s, reason: e.target.value as StockReason }))} className="w-full mt-1 rounded-lg border border-kanovi-cream dark:border-white/10 p-2 dark:bg-kanovi-dark dark:text-white">
              <option value="RESTOCK">📦 RESTOCK (Barang Masuk)</option>
              <option value="ADJUSTMENT">🔧 ADJUSTMENT (Koreksi Data)</option>
              <option value="SPOIL">🗑️ SPOIL (Barang Rusak/Basi)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold uppercase text-gray-400">Jumlah Perubahan</label>
            <input type="number" value={adjustForm.qtyChange} onChange={(e) => setAdjustForm((s: any) => ({ ...s, qtyChange: Number(e.target.value) }))} className="w-full mt-1 rounded-lg border border-kanovi-cream dark:border-white/10 p-2 dark:bg-transparent dark:text-white text-lg font-bold" required />
          </div>

          <p className="text-[10px] text-gray-400 italic">
            * RESTOCK otomatis positif. SPOIL otomatis negatif.
          </p>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-gray-500">Batal</button>
            <button type="submit" className="rounded-lg bg-kanovi-wood px-6 py-2 font-bold text-white shadow-lg">Simpan Adjustment</button>
          </div>
        </form>
      </div>
    </div>
  );
}