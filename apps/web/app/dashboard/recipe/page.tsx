"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "../../../lib/api";
import type {
  Ingredient,
  Menu,
  MenuRecipeResponse,
  RecipeItem,
  RecipePayloadItem,
} from "../../../types";

type MenuWithRecipeFlag = Menu & {
  hasRecipe?: boolean;
  recipeCount?: number;
};

type EditableRecipeItem = {
  ingredientId: number;
  ingredientName: string;
  unit: string;
  amountNeeded: number;
};

export default function RecipePage() {
  const [menus, setMenus] = useState<MenuWithRecipeFlag[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [selectedMenuId, setSelectedMenuId] = useState<number | null>(null);

  const [recipeItems, setRecipeItems] = useState<EditableRecipeItem[]>([]);
  const [selectedIngredientId, setSelectedIngredientId] = useState<number | "">("");
  const [amountNeeded, setAmountNeeded] = useState<number>(1);

  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingRecipe, setLoadingRecipe] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const selectedMenu = useMemo(
    () => menus.find((menu) => menu.id === selectedMenuId) ?? null,
    [menus, selectedMenuId]
  );

  const selectedIngredient = useMemo(
    () =>
      ingredients.find((ingredient) => ingredient.id === Number(selectedIngredientId)) ?? null,
    [ingredients, selectedIngredientId]
  );

  useEffect(() => {
    void loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedMenuId === null) return;
    void loadRecipe(selectedMenuId);
  }, [selectedMenuId]);

  async function loadInitialData() {
    setLoadingInitial(true);
    setError("");

    try {
      const [menuData, ingredientData] = await Promise.all([
        api.getMenus(),
        api.getIngredients(),
      ]);

      const safeMenus: MenuWithRecipeFlag[] = Array.isArray(menuData) ? menuData : [];
      const safeIngredients: Ingredient[] = Array.isArray(ingredientData) ? ingredientData : [];

      setIngredients(safeIngredients);

      const menuFlags = await Promise.all(
        safeMenus.map(async (menu) => {
          try {
            const recipe = (await api.getMenuRecipe(menu.id)) as MenuRecipeResponse;
            const count = Array.isArray(recipe?.items) ? recipe.items.length : 0;

            return {
              ...menu,
              hasRecipe: count > 0,
              recipeCount: count,
            };
          } catch {
            return {
              ...menu,
              hasRecipe: false,
              recipeCount: 0,
            };
          }
        })
      );

      setMenus(menuFlags);

      if (menuFlags.length > 0) {
        setSelectedMenuId(menuFlags[0].id);
      }
    } catch (err: any) {
      setError(err?.message || "Gagal memuat data recipe.");
    } finally {
      setLoadingInitial(false);
    }
  }

  async function loadRecipe(menuId: number) {
    setLoadingRecipe(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = (await api.getMenuRecipe(menuId)) as MenuRecipeResponse;

      const items: EditableRecipeItem[] = (response.items || []).map((item: RecipeItem) => ({
        ingredientId: item.ingredientId,
        ingredientName: item.ingredientName,
        unit: item.unit,
        amountNeeded: item.amountNeeded,
      }));

      setRecipeItems(items);

      setMenus((prev) =>
        prev.map((menu) =>
          menu.id === menuId
            ? {
                ...menu,
                hasRecipe: items.length > 0,
                recipeCount: items.length,
              }
            : menu
        )
      );
    } catch (err: any) {
      setRecipeItems([]);
      setError(err?.message || "Gagal memuat recipe menu.");
    } finally {
      setLoadingRecipe(false);
    }
  }

  function handleAddIngredient() {
    setError("");
    setSuccessMessage("");

    if (!selectedIngredient) {
      setError("Pilih ingredient terlebih dahulu.");
      return;
    }

    if (!Number.isInteger(amountNeeded) || amountNeeded <= 0) {
      setError("Amount needed harus lebih dari 0.");
      return;
    }

    const isDuplicate = recipeItems.some(
      (item) => item.ingredientId === selectedIngredient.id
    );

    if (isDuplicate) {
      setError("Ingredient sudah ada di recipe. Tidak boleh duplikat.");
      return;
    }

    setRecipeItems((prev) => [
      ...prev,
      {
        ingredientId: selectedIngredient.id,
        ingredientName: selectedIngredient.name,
        unit: selectedIngredient.unit,
        amountNeeded,
      },
    ]);

    setSelectedIngredientId("");
    setAmountNeeded(1);
  }

  function handleAmountChange(ingredientId: number, value: string) {
    const nextValue = Number(value);

    setRecipeItems((prev) =>
      prev.map((item) =>
        item.ingredientId === ingredientId
          ? {
              ...item,
              amountNeeded: Number.isFinite(nextValue) && nextValue > 0 ? nextValue : 1,
            }
          : item
      )
    );
  }

  function handleRemoveIngredient(ingredientId: number) {
    setError("");
    setSuccessMessage("");

    setRecipeItems((prev) => prev.filter((item) => item.ingredientId !== ingredientId));
  }

  async function handleSaveRecipe() {
    if (!selectedMenuId) {
      setError("Pilih menu terlebih dahulu.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      const duplicateCheck = new Set<number>();

      for (const item of recipeItems) {
        if (duplicateCheck.has(item.ingredientId)) {
          setError(`Ingredient ${item.ingredientName} duplikat.`);
          setSaving(false);
          return;
        }
        duplicateCheck.add(item.ingredientId);
      }

      const payloadItems: RecipePayloadItem[] = recipeItems.map((item) => ({
        ingredientId: item.ingredientId,
        amountNeeded: item.amountNeeded,
      }));

      await api.replaceMenuRecipe(selectedMenuId, {
        items: payloadItems,
      });

      setSuccessMessage("Recipe berhasil disimpan.");
      await loadRecipe(selectedMenuId);
    } catch (err: any) {
      setError(err?.message || "Gagal menyimpan recipe.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="space-y-6">
      <section className="rounded-3xl border border-kanovi-cream/50 dark:border-white/5 bg-white/80 dark:bg-kanovi-darker/80 backdrop-blur-sm shadow-sm p-6 md:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-kanovi-cream/50 dark:bg-kanovi-wood/20 px-3 py-1 text-xs font-semibold text-kanovi-wood dark:text-kanovi-wood">
              📖 Recipe Management
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-kanovi-coffee dark:text-kanovi-bone">
              Kelola Recipe Menu
            </h1>
            <p className="mt-2 max-w-2xl text-sm md:text-base text-kanovi-coffee/70 dark:text-kanovi-cream/70">
              Atur komposisi bahan tiap menu, cek recipe yang aktif, dan simpan perubahan
              tanpa perlu menyentuh database secara langsung.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 md:min-w-[320px]">
            <div className="rounded-2xl border border-kanovi-cream/50 dark:border-white/5 bg-kanovi-bone/70 dark:bg-kanovi-dark p-4">
              <div className="text-xs uppercase tracking-wide text-kanovi-coffee/60 dark:text-kanovi-cream/60">
                Total Menu
              </div>
              <div className="mt-2 text-2xl font-bold text-kanovi-coffee dark:text-kanovi-bone">
                {menus.length}
              </div>
            </div>

            <div className="rounded-2xl border border-kanovi-cream/50 dark:border-white/5 bg-kanovi-bone/70 dark:bg-kanovi-dark p-4">
              <div className="text-xs uppercase tracking-wide text-kanovi-coffee/60 dark:text-kanovi-cream/60">
                Menu Dipilih
              </div>
              <div className="mt-2 truncate text-sm font-semibold text-kanovi-coffee dark:text-kanovi-bone">
                {selectedMenu?.name ?? "-"}
              </div>
            </div>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300 shadow-sm">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300 shadow-sm">
          {successMessage}
        </div>
      )}

      {loadingInitial ? (
        <section className="rounded-3xl border border-kanovi-cream/50 dark:border-white/5 bg-white/80 dark:bg-kanovi-darker/80 p-8 shadow-sm">
          <div className="animate-pulse space-y-4">
            <div className="h-6 w-48 rounded bg-kanovi-cream/50 dark:bg-white/10" />
            <div className="h-12 w-full rounded-xl bg-kanovi-cream/40 dark:bg-white/5" />
            <div className="grid gap-3 md:grid-cols-2">
              <div className="h-24 rounded-2xl bg-kanovi-cream/40 dark:bg-white/5" />
              <div className="h-24 rounded-2xl bg-kanovi-cream/40 dark:bg-white/5" />
            </div>
          </div>
        </section>
      ) : (
        <>
          <section className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
            <div className="rounded-3xl border border-kanovi-cream/50 dark:border-white/5 bg-white/80 dark:bg-kanovi-darker/80 shadow-sm overflow-hidden">
              <div className="border-b border-kanovi-cream/50 dark:border-white/5 px-5 py-4">
                <h2 className="text-lg font-bold text-kanovi-coffee dark:text-kanovi-bone">
                  Pilih Menu
                </h2>
                <p className="mt-1 text-sm text-kanovi-coffee/65 dark:text-kanovi-cream/65">
                  Pilih menu yang ingin kamu atur recipe-nya.
                </p>
              </div>

              <div className="p-5 space-y-4">
                <select
                  className="w-full rounded-2xl border border-kanovi-cream/60 dark:border-white/10 bg-kanovi-bone/80 dark:bg-kanovi-dark px-4 py-3 text-sm text-kanovi-coffee dark:text-kanovi-bone outline-none transition focus:border-kanovi-wood"
                  value={selectedMenuId ?? ""}
                  onChange={(e) => setSelectedMenuId(Number(e.target.value))}
                >
                  {menus.length === 0 && <option value="">Belum ada menu</option>}
                  {menus.map((menu) => (
                    <option key={menu.id} value={menu.id}>
                      {menu.name} - Rp {menu.price.toLocaleString("id-ID")}
                    </option>
                  ))}
                </select>

                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  {menus.map((menu) => {
                    const isActive = menu.id === selectedMenuId;

                    return (
                      <button
                        key={menu.id}
                        type="button"
                        onClick={() => setSelectedMenuId(menu.id)}
                        className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                          isActive
                            ? "border-kanovi-wood bg-kanovi-cream/40 dark:bg-kanovi-wood/15 shadow-sm"
                            : "border-kanovi-cream/50 dark:border-white/5 bg-kanovi-bone/60 dark:bg-kanovi-dark hover:border-kanovi-wood/60 hover:bg-kanovi-cream/20 dark:hover:bg-white/5"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-semibold text-kanovi-coffee dark:text-kanovi-bone">
                              {menu.name}
                            </div>
                            <div className="mt-1 text-xs text-kanovi-coffee/60 dark:text-kanovi-cream/60">
                              Rp {menu.price.toLocaleString("id-ID")}
                            </div>
                          </div>

                          {menu.hasRecipe ? (
                            <span className="shrink-0 rounded-full bg-emerald-100 dark:bg-emerald-500/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                              Ada recipe
                            </span>
                          ) : (
                            <span className="shrink-0 rounded-full bg-amber-100 dark:bg-amber-500/15 px-2.5 py-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                              Belum ada
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-3xl border border-kanovi-cream/50 dark:border-white/5 bg-white/80 dark:bg-kanovi-darker/80 shadow-sm">
                <div className="border-b border-kanovi-cream/50 dark:border-white/5 px-5 py-4">
                  <h2 className="text-lg font-bold text-kanovi-coffee dark:text-kanovi-bone">
                    Ringkasan Menu
                  </h2>
                </div>

                <div className="grid gap-4 p-5 md:grid-cols-3">
                  <div className="rounded-2xl bg-kanovi-bone/80 dark:bg-kanovi-dark p-4 border border-kanovi-cream/50 dark:border-white/5">
                    <div className="text-xs text-kanovi-coffee/60 dark:text-kanovi-cream/60">
                      Nama Menu
                    </div>
                    <div className="mt-2 font-semibold text-kanovi-coffee dark:text-kanovi-bone">
                      {selectedMenu?.name ?? "-"}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-kanovi-bone/80 dark:bg-kanovi-dark p-4 border border-kanovi-cream/50 dark:border-white/5">
                    <div className="text-xs text-kanovi-coffee/60 dark:text-kanovi-cream/60">
                      Harga
                    </div>
                    <div className="mt-2 font-semibold text-kanovi-coffee dark:text-kanovi-bone">
                      {selectedMenu ? `Rp ${selectedMenu.price.toLocaleString("id-ID")}` : "-"}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-kanovi-bone/80 dark:bg-kanovi-dark p-4 border border-kanovi-cream/50 dark:border-white/5">
                    <div className="text-xs text-kanovi-coffee/60 dark:text-kanovi-cream/60">
                      Status Recipe
                    </div>
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

              <div className="rounded-3xl border border-kanovi-cream/50 dark:border-white/5 bg-white/80 dark:bg-kanovi-darker/80 shadow-sm">
                <div className="border-b border-kanovi-cream/50 dark:border-white/5 px-5 py-4">
                  <h2 className="text-lg font-bold text-kanovi-coffee dark:text-kanovi-bone">
                    Tambah Ingredient
                  </h2>
                  <p className="mt-1 text-sm text-kanovi-coffee/65 dark:text-kanovi-cream/65">
                    Pilih bahan dan tentukan jumlah yang dibutuhkan untuk satu menu.
                  </p>
                </div>

                <div className="p-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_140px]">
                  <select
                    className="rounded-2xl border border-kanovi-cream/60 dark:border-white/10 bg-kanovi-bone/80 dark:bg-kanovi-dark px-4 py-3 text-sm text-kanovi-coffee dark:text-kanovi-bone outline-none transition focus:border-kanovi-wood"
                    value={selectedIngredientId}
                    onChange={(e) =>
                      setSelectedIngredientId(e.target.value ? Number(e.target.value) : "")
                    }
                  >
                    <option value="">Pilih ingredient</option>
                    {ingredients.map((ingredient) => {
                      const exists = recipeItems.some(
                        (item) => item.ingredientId === ingredient.id
                      );

                      return (
                        <option key={ingredient.id} value={ingredient.id} disabled={exists}>
                          {ingredient.name} ({ingredient.unit})
                          {exists ? " - sudah dipakai" : ""}
                        </option>
                      );
                    })}
                  </select>

                  <input
                    type="number"
                    min={1}
                    value={amountNeeded}
                    onChange={(e) => setAmountNeeded(Number(e.target.value))}
                    className="rounded-2xl border border-kanovi-cream/60 dark:border-white/10 bg-kanovi-bone/80 dark:bg-kanovi-dark px-4 py-3 text-sm text-kanovi-coffee dark:text-kanovi-bone outline-none transition focus:border-kanovi-wood"
                    placeholder="Amount"
                  />

                  <button
                    type="button"
                    onClick={handleAddIngredient}
                    className="rounded-2xl bg-kanovi-wood hover:brightness-110 px-4 py-3 text-sm font-semibold text-white transition disabled:opacity-60"
                  >
                    + Tambah
                  </button>
                </div>

                {selectedIngredient && (
                  <div className="px-5 pb-5">
                    <div className="rounded-2xl bg-kanovi-cream/25 dark:bg-kanovi-wood/10 border border-kanovi-cream/50 dark:border-white/5 px-4 py-3 text-sm text-kanovi-coffee dark:text-kanovi-cream">
                      Ingredient terpilih: <span className="font-semibold">{selectedIngredient.name}</span>{" "}
                      · Unit: <span className="font-semibold">{selectedIngredient.unit}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-3xl border border-kanovi-cream/50 dark:border-white/5 bg-white/80 dark:bg-kanovi-darker/80 shadow-sm overflow-hidden">
                <div className="flex flex-col gap-3 border-b border-kanovi-cream/50 dark:border-white/5 px-5 py-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-kanovi-coffee dark:text-kanovi-bone">
                      Recipe Aktif
                    </h2>
                    <p className="mt-1 text-sm text-kanovi-coffee/65 dark:text-kanovi-cream/65">
                      Ubah jumlah bahan, hapus item, lalu simpan perubahan.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveRecipe}
                    disabled={saving || !selectedMenuId}
                    className="rounded-2xl bg-kanovi-coffee hover:brightness-110 px-5 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? "Menyimpan..." : "Simpan Recipe"}
                  </button>
                </div>

                <div className="p-5">
                  {loadingRecipe ? (
                    <div className="rounded-2xl border border-kanovi-cream/50 dark:border-white/5 bg-kanovi-bone/70 dark:bg-kanovi-dark px-4 py-6 text-sm text-kanovi-coffee/70 dark:text-kanovi-cream/70">
                      Memuat recipe...
                    </div>
                  ) : recipeItems.length === 0 ? (
                    <div className="rounded-2xl border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 px-4 py-6 text-sm text-amber-800 dark:text-amber-300">
                      Recipe masih kosong. Tambahkan ingredient untuk menu ini agar bisa dipakai
                      saat stock-check dan pembayaran.
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
                            {recipeItems.map((item) => (
                              <tr key={item.ingredientId}>
                                <td className="px-4 py-3">
                                  <div className="font-medium text-kanovi-coffee dark:text-kanovi-bone">
                                    {item.ingredientName}
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="rounded-full bg-kanovi-bone dark:bg-kanovi-dark px-2.5 py-1 text-xs text-kanovi-coffee dark:text-kanovi-cream border border-kanovi-cream/50 dark:border-white/5">
                                    {item.unit}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <input
                                    type="number"
                                    min={1}
                                    value={item.amountNeeded}
                                    onChange={(e) =>
                                      handleAmountChange(item.ingredientId, e.target.value)
                                    }
                                    className="w-32 rounded-xl border border-kanovi-cream/60 dark:border-white/10 bg-kanovi-bone/80 dark:bg-kanovi-dark px-3 py-2 text-sm text-kanovi-coffee dark:text-kanovi-bone outline-none transition focus:border-kanovi-wood"
                                  />
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveIngredient(item.ingredientId)}
                                    className="rounded-xl bg-red-600 hover:bg-red-700 px-3 py-2 text-xs font-semibold text-white transition"
                                  >
                                    Hapus
                                  </button>
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
            </div>
          </section>
        </>
      )}
    </main>
  );
}