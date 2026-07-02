import { Ingredient } from "../../types";

// 1. KOMPONEN SIDEBAR (PILIH MENU)
export function RecipeSidebar({ menus, selectedMenuId, onSelect }: any) {
  return (
    <div className="rounded-3xl border border-kanovi-cream/50 dark:border-white/5 bg-white/80 dark:bg-kanovi-darker/80 shadow-sm overflow-hidden">
      <div className="border-b border-kanovi-cream/50 dark:border-white/5 px-5 py-4">
        <h2 className="text-lg font-bold text-kanovi-coffee dark:text-kanovi-bone">Pilih Menu</h2>
        <p className="mt-1 text-sm text-kanovi-coffee/65 dark:text-kanovi-cream/65">Pilih menu yang ingin kamu atur recipe-nya.</p>
      </div>
      <div className="p-5 space-y-4">
        <select
          className="w-full rounded-2xl border border-kanovi-cream/60 dark:border-white/10 bg-kanovi-bone/80 dark:bg-kanovi-dark px-4 py-3 text-sm text-kanovi-coffee dark:text-kanovi-bone outline-none transition focus:border-kanovi-wood"
          value={selectedMenuId ?? ""}
          onChange={(e) => onSelect(Number(e.target.value))}
        >
          {menus.length === 0 && <option value="">Belum ada menu</option>}
          {menus.map((menu: any) => (
            <option key={menu.id} value={menu.id}>{menu.name} - Rp {menu.price.toLocaleString("id-ID")}</option>
          ))}
        </select>
        <div className="space-y-3 max-h-105 overflow-y-auto pr-1">
          {menus.map((menu: any) => {
            const isActive = menu.id === selectedMenuId;
            return (
              <button
                key={menu.id} type="button" onClick={() => onSelect(menu.id)}
                className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                  isActive ? "border-kanovi-wood bg-kanovi-cream/40 dark:bg-kanovi-wood/15 shadow-sm" : "border-kanovi-cream/50 dark:border-white/5 bg-kanovi-bone/60 dark:bg-kanovi-dark hover:border-kanovi-wood/60 hover:bg-kanovi-cream/20 dark:hover:bg-white/5"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-kanovi-coffee dark:text-kanovi-bone">{menu.name}</div>
                    <div className="mt-1 text-xs text-kanovi-coffee/60 dark:text-kanovi-cream/60">Rp {menu.price.toLocaleString("id-ID")}</div>
                  </div>
                  {menu.hasRecipe ? (
                    <span className="shrink-0 rounded-full bg-emerald-100 dark:bg-emerald-500/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">Ada recipe</span>
                  ) : (
                    <span className="shrink-0 rounded-full bg-amber-100 dark:bg-amber-500/15 px-2.5 py-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300">Belum ada</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// 2. KOMPONEN RINGKASAN MENU
export function RecipeSummaryCards({ selectedMenu, recipeItems }: any) {
  return (
    <div className="rounded-3xl border border-kanovi-cream/50 dark:border-white/5 bg-white/80 dark:bg-kanovi-darker/80 shadow-sm">
      <div className="border-b border-kanovi-cream/50 dark:border-white/5 px-5 py-4">
        <h2 className="text-lg font-bold text-kanovi-coffee dark:text-kanovi-bone">Ringkasan Menu</h2>
      </div>
      <div className="grid gap-4 p-5 md:grid-cols-3">
        <div className="rounded-2xl bg-kanovi-bone/80 dark:bg-kanovi-dark p-4 border border-kanovi-cream/50 dark:border-white/5">
          <div className="text-xs text-kanovi-coffee/60 dark:text-kanovi-cream/60">Nama Menu</div>
          <div className="mt-2 font-semibold text-kanovi-coffee dark:text-kanovi-bone">{selectedMenu?.name ?? "-"}</div>
        </div>
        <div className="rounded-2xl bg-kanovi-bone/80 dark:bg-kanovi-dark p-4 border border-kanovi-cream/50 dark:border-white/5">
          <div className="text-xs text-kanovi-coffee/60 dark:text-kanovi-cream/60">Harga</div>
          <div className="mt-2 font-semibold text-kanovi-coffee dark:text-kanovi-bone">{selectedMenu ? `Rp ${selectedMenu.price.toLocaleString("id-ID")}` : "-"}</div>
        </div>
        <div className="rounded-2xl bg-kanovi-bone/80 dark:bg-kanovi-dark p-4 border border-kanovi-cream/50 dark:border-white/5">
          <div className="text-xs text-kanovi-coffee/60 dark:text-kanovi-cream/60">Status Recipe</div>
          <div className="mt-2 font-semibold">
            {recipeItems.length > 0 ? (
              <span className="text-emerald-700 dark:text-emerald-300">Sudah ada recipe</span>
            ) : (
              <span className="text-amber-700 dark:text-amber-300">Belum ada recipe</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// 3. KOMPONEN FORM TAMBAH BAHAN
export function RecipeAddForm({ ingredients, selectedIngredientId, onSelectIngredient, amountNeeded, onAmountChange, onAdd, selectedIngredient, recipeItems }: any) {
  return (
    <div className="rounded-3xl border border-kanovi-cream/50 dark:border-white/5 bg-white/80 dark:bg-kanovi-darker/80 shadow-sm">
      <div className="border-b border-kanovi-cream/50 dark:border-white/5 px-5 py-4">
        <h2 className="text-lg font-bold text-kanovi-coffee dark:text-kanovi-bone">Tambah Ingredient</h2>
        <p className="mt-1 text-sm text-kanovi-coffee/65 dark:text-kanovi-cream/65">Pilih bahan dan tentukan jumlah yang dibutuhkan untuk satu menu.</p>
      </div>
      <div className="p-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_140px]">
        <select
          className="rounded-2xl border border-kanovi-cream/60 dark:border-white/10 bg-kanovi-bone/80 dark:bg-kanovi-dark px-4 py-3 text-sm text-kanovi-coffee dark:text-kanovi-bone outline-none transition focus:border-kanovi-wood"
          value={selectedIngredientId}
          onChange={(e) => onSelectIngredient(e.target.value ? Number(e.target.value) : "")}
        >
          <option value="">Pilih ingredient</option>
          {ingredients.map((ingredient: Ingredient) => {
            const exists = recipeItems.some((item: any) => item.ingredientId === ingredient.id);
            return (
              <option key={ingredient.id} value={ingredient.id} disabled={exists}>
                {ingredient.name} ({ingredient.unit}) {exists ? " - sudah dipakai" : ""}
              </option>
            );
          })}
        </select>
        <input
          type="number" min={1} value={amountNeeded} onChange={(e) => onAmountChange(Number(e.target.value))}
          className="rounded-2xl border border-kanovi-cream/60 dark:border-white/10 bg-kanovi-bone/80 dark:bg-kanovi-dark px-4 py-3 text-sm text-kanovi-coffee dark:text-kanovi-bone outline-none transition focus:border-kanovi-wood"
          placeholder="Amount"
        />
        <button type="button" onClick={onAdd} className="rounded-2xl bg-kanovi-wood hover:brightness-110 px-4 py-3 text-sm font-semibold text-white transition disabled:opacity-60">+ Tambah</button>
      </div>
      {selectedIngredient && (
        <div className="px-5 pb-5">
          <div className="rounded-2xl bg-kanovi-cream/25 dark:bg-kanovi-wood/10 border border-kanovi-cream/50 dark:border-white/5 px-4 py-3 text-sm text-kanovi-coffee dark:text-kanovi-cream">
            Ingredient terpilih: <span className="font-semibold">{selectedIngredient.name}</span> · Unit: <span className="font-semibold">{selectedIngredient.unit}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// 4. KOMPONEN TABEL RECIPE AKTIF
export function RecipeTableList({ recipeItems, loadingRecipe, onAmountChange, onRemove, onSave, saving, selectedMenuId }: any) {
  return (
    <div className="rounded-3xl border border-kanovi-cream/50 dark:border-white/5 bg-white/80 dark:bg-kanovi-darker/80 shadow-sm overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-kanovi-cream/50 dark:border-white/5 px-5 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-bold text-kanovi-coffee dark:text-kanovi-bone">Recipe Aktif</h2>
          <p className="mt-1 text-sm text-kanovi-coffee/65 dark:text-kanovi-cream/65">Ubah jumlah bahan, hapus item, lalu simpan perubahan.</p>
        </div>
        <button
          type="button" onClick={onSave} disabled={saving || !selectedMenuId}
          className="rounded-2xl bg-kanovi-coffee hover:brightness-110 px-5 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Menyimpan..." : "Simpan Recipe"}
        </button>
      </div>
      <div className="p-5">
        {loadingRecipe ? (
          <div className="rounded-2xl border border-kanovi-cream/50 dark:border-white/5 bg-kanovi-bone/70 dark:bg-kanovi-dark px-4 py-6 text-sm text-kanovi-coffee/70 dark:text-kanovi-cream/70">Memuat recipe...</div>
        ) : recipeItems.length === 0 ? (
          <div className="rounded-2xl border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 px-4 py-6 text-sm text-amber-800 dark:text-amber-300">
            Recipe masih kosong. Tambahkan ingredient untuk menu ini agar bisa dipakai saat stock-check dan pembayaran.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-kanovi-cream/50 dark:border-white/5">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-kanovi-cream/30 dark:bg-white/5">
                  <tr className="text-left text-kanovi-coffee dark:text-kanovi-bone">
                    <th className="px-4 py-3 font-semibold">Ingredient</th>
                    <th className="px-4 py-3 font-semibold">Unit</th>
                    <th className="px-4 py-3 font-semibold">Amount Needed</th>
                    <th className="px-4 py-3 font-semibold text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-kanovi-cream/50 dark:divide-white/5 bg-white/50 dark:bg-kanovi-darker/40">
                  {recipeItems.map((item: any) => (
                    <tr key={item.ingredientId}>
                      <td className="px-4 py-3"><div className="font-medium text-kanovi-coffee dark:text-kanovi-bone">{item.ingredientName}</div></td>
                      <td className="px-4 py-3"><span className="rounded-full bg-kanovi-bone dark:bg-kanovi-dark px-2.5 py-1 text-xs text-kanovi-coffee dark:text-kanovi-cream border border-kanovi-cream/50 dark:border-white/5">{item.unit}</span></td>
                      <td className="px-4 py-3">
                        <input
                          type="number" min={1} value={item.amountNeeded}
                          onChange={(e) => onAmountChange(item.ingredientId, e.target.value)}
                          className="w-32 rounded-xl border border-kanovi-cream/60 dark:border-white/10 bg-kanovi-bone/80 dark:bg-kanovi-dark px-3 py-2 text-sm text-kanovi-coffee dark:text-kanovi-bone outline-none transition focus:border-kanovi-wood"
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button type="button" onClick={() => onRemove(item.ingredientId)} className="rounded-xl bg-red-600 hover:bg-red-700 px-3 py-2 text-xs font-semibold text-white transition">Hapus</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}