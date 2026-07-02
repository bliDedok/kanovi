"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "../../../lib/api";
import type { Ingredient, MenuRecipeResponse, RecipeItem, RecipePayloadItem, MenuWithRecipeFlag, EditableRecipeItem } from "../../../types";

// Import Komponen Bersih
import { RecipeSidebar, RecipeSummaryCards, RecipeAddForm, RecipeTableList } from "../../components/RecipeComponents";

export default function RecipePage() {
  // --- STATES ---
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

  // --- MEMOS ---
  const selectedMenu = useMemo(() => menus.find((menu) => menu.id === selectedMenuId) ?? null, [menus, selectedMenuId]);
  const selectedIngredient = useMemo(() => ingredients.find((ingredient) => ingredient.id === Number(selectedIngredientId)) ?? null, [ingredients, selectedIngredientId]);

  // --- EFFECTS ---
  useEffect(() => { void loadInitialData(); }, []);
  useEffect(() => { if (selectedMenuId !== null) void loadRecipe(selectedMenuId); }, [selectedMenuId]);

  // --- API CALLS ---
  async function loadInitialData() {
    setLoadingInitial(true); setError("");
    try {
      const [menuData, ingredientData] = await Promise.all([api.getMenus(), api.getIngredients()]);
      const safeMenus: MenuWithRecipeFlag[] = Array.isArray(menuData) ? menuData : [];
      setIngredients(Array.isArray(ingredientData) ? ingredientData : []);

      const menuFlags = await Promise.all(safeMenus.map(async (menu) => {
        try {
          const recipe = (await api.getMenuRecipe(menu.id)) as MenuRecipeResponse;
          const count = Array.isArray(recipe?.items) ? recipe.items.length : 0;
          return { ...menu, hasRecipe: count > 0, recipeCount: count };
        } catch { return { ...menu, hasRecipe: false, recipeCount: 0 }; }
      }));

      setMenus(menuFlags);
      if (menuFlags.length > 0) setSelectedMenuId(menuFlags[0].id);
    } catch (err: any) { setError(err?.message || "Gagal memuat data recipe."); } 
    finally { setLoadingInitial(false); }
  }

  async function loadRecipe(menuId: number) {
    setLoadingRecipe(true); setError(""); setSuccessMessage("");
    try {
      const response = (await api.getMenuRecipe(menuId)) as MenuRecipeResponse;
      const items: EditableRecipeItem[] = (response.items || []).map((item: RecipeItem) => ({
        ingredientId: item.ingredientId, ingredientName: item.ingredientName, unit: item.unit, amountNeeded: item.amountNeeded,
      }));
      setRecipeItems(items);
      setMenus((prev) => prev.map((menu) => menu.id === menuId ? { ...menu, hasRecipe: items.length > 0, recipeCount: items.length } : menu));
    } catch (err: any) {
      setRecipeItems([]); setError(err?.message || "Gagal memuat recipe menu.");
    } finally { setLoadingRecipe(false); }
  }

  // --- HANDLERS ---
  function handleAddIngredient() {
    setError(""); setSuccessMessage("");
    if (!selectedIngredient) return setError("Pilih ingredient terlebih dahulu.");
    if (!Number.isInteger(amountNeeded) || amountNeeded <= 0) return setError("Amount needed harus lebih dari 0.");
    if (recipeItems.some((item) => item.ingredientId === selectedIngredient.id)) return setError("Ingredient sudah ada di recipe. Tidak boleh duplikat.");

    setRecipeItems((prev) => [...prev, { ingredientId: selectedIngredient.id, ingredientName: selectedIngredient.name, unit: selectedIngredient.unit, amountNeeded }]);
    setSelectedIngredientId(""); setAmountNeeded(1);
  }

  function handleAmountChange(ingredientId: number, value: string) {
    const nextValue = Number(value);
    setRecipeItems((prev) => prev.map((item) => item.ingredientId === ingredientId ? { ...item, amountNeeded: Number.isFinite(nextValue) && nextValue > 0 ? nextValue : 1 } : item));
  }

  function handleRemoveIngredient(ingredientId: number) {
    setError(""); setSuccessMessage("");
    setRecipeItems((prev) => prev.filter((item) => item.ingredientId !== ingredientId));
  }

  async function handleSaveRecipe() {
    if (!selectedMenuId) return setError("Pilih menu terlebih dahulu.");
    setSaving(true); setError(""); setSuccessMessage("");

    try {
      const duplicateCheck = new Set<number>();
      for (const item of recipeItems) {
        if (duplicateCheck.has(item.ingredientId)) {
          setSaving(false); return setError(`Ingredient ${item.ingredientName} duplikat.`);
        }
        duplicateCheck.add(item.ingredientId);
      }

      const payloadItems: RecipePayloadItem[] = recipeItems.map((item) => ({ ingredientId: item.ingredientId, amountNeeded: item.amountNeeded }));
      await api.replaceMenuRecipe(selectedMenuId, { items: payloadItems });

      setSuccessMessage("Recipe berhasil disimpan.");
      await loadRecipe(selectedMenuId);
    } catch (err: any) { setError(err?.message || "Gagal menyimpan recipe."); } 
    finally { setSaving(false); }
  }

  return (
    <main className="space-y-6">
      {/* HEADER SECTION */}
      <section className="rounded-3xl border border-kanovi-cream/50 dark:border-white/5 bg-white/80 dark:bg-kanovi-darker/80 backdrop-blur-sm shadow-sm p-6 md:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-kanovi-cream/50 dark:bg-kanovi-wood/20 px-3 py-1 text-xs font-semibold text-kanovi-wood dark:text-kanovi-wood">📖 Recipe Management</div>
            <h1 className="text-3xl md:text-4xl font-bold text-kanovi-coffee dark:text-kanovi-bone">Kelola Recipe Menu</h1>
            <p className="mt-2 max-w-2xl text-sm md:text-base text-kanovi-coffee/70 dark:text-kanovi-cream/70">Atur komposisi bahan tiap menu, cek recipe yang aktif, dan simpan perubahan tanpa perlu menyentuh database secara langsung.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 md:min-w-[320px]">
            <div className="rounded-2xl border border-kanovi-cream/50 dark:border-white/5 bg-kanovi-bone/70 dark:bg-kanovi-dark p-4">
              <div className="text-xs uppercase tracking-wide text-kanovi-coffee/60 dark:text-kanovi-cream/60">Total Menu</div>
              <div className="mt-2 text-2xl font-bold text-kanovi-coffee dark:text-kanovi-bone">{menus.length}</div>
            </div>
            <div className="rounded-2xl border border-kanovi-cream/50 dark:border-white/5 bg-kanovi-bone/70 dark:bg-kanovi-dark p-4">
              <div className="text-xs uppercase tracking-wide text-kanovi-coffee/60 dark:text-kanovi-cream/60">Menu Dipilih</div>
              <div className="mt-2 truncate text-sm font-semibold text-kanovi-coffee dark:text-kanovi-bone">{selectedMenu?.name ?? "-"}</div>
            </div>
          </div>
        </div>
      </section>

      {/* NOTIFICATIONS */}
      {error && <div className="rounded-2xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300 shadow-sm">{error}</div>}
      {successMessage && <div className="rounded-2xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300 shadow-sm">{successMessage}</div>}

      {/* MAIN CONTENT */}
      {loadingInitial ? (
        <section className="rounded-3xl border border-kanovi-cream/50 dark:border-white/5 bg-white/80 dark:bg-kanovi-darker/80 p-8 shadow-sm">
          <div className="animate-pulse space-y-4">
            <div className="h-6 w-48 rounded bg-kanovi-cream/50 dark:bg-white/10" />
            <div className="h-12 w-full rounded-xl bg-kanovi-cream/40 dark:bg-white/5" />
            <div className="grid gap-3 md:grid-cols-2"><div className="h-24 rounded-2xl bg-kanovi-cream/40 dark:bg-white/5" /><div className="h-24 rounded-2xl bg-kanovi-cream/40 dark:bg-white/5" /></div>
          </div>
        </section>
      ) : (
        <section className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          {/* SIDEBAR */}
          <RecipeSidebar menus={menus} selectedMenuId={selectedMenuId} onSelect={setSelectedMenuId} />

          <div className="space-y-6">
            {/* SUMMARY CARDS */}
            <RecipeSummaryCards selectedMenu={selectedMenu} recipeItems={recipeItems} />

            {/* ADD FORM */}
            <RecipeAddForm 
              ingredients={ingredients} selectedIngredientId={selectedIngredientId} onSelectIngredient={setSelectedIngredientId}
              amountNeeded={amountNeeded} onAmountChange={setAmountNeeded} onAdd={handleAddIngredient}
              selectedIngredient={selectedIngredient} recipeItems={recipeItems}
            />

            {/* RECIPE TABLE */}
            <RecipeTableList 
              recipeItems={recipeItems} loadingRecipe={loadingRecipe} onAmountChange={handleAmountChange} 
              onRemove={handleRemoveIngredient} onSave={handleSaveRecipe} saving={saving} selectedMenuId={selectedMenuId}
            />
          </div>
        </section>
      )}
    </main>
  );
}