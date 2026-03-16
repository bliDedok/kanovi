"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";

type Category = {
  id: number;
  name: string;
  slug: string;
  isActive?: boolean;
  sortOrder?: number;
};

type Menu = {
  id: number;
  name: string;
  price: number;
  categoryId?: number | null;
  category?: Category | null;
};

type Ingredient = {
  id: number;
  name: string;
  stock: number;
  unit: string;
  minStock: number;
};

type RecipeRow = {
  ingredientId: string;
  amountNeeded: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3001";

export default function MenuListPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [editCategoryId, setEditCategoryId] = useState<string>("");
  const hasLoadedRef = useRef(false);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [menuToDelete, setMenuToDelete] = useState<{id: number, name: string} | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);
  const [recipeItems, setRecipeItems] = useState<RecipeRow[]>([ { ingredientId: "", amountNeeded: "" },]);
  const [isRecipeLoading, setIsRecipeLoading] = useState(false);
  const [isRecipeSaving, setIsRecipeSaving] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [isEditSaving, setIsEditSaving] = useState(false);
  const getToken = () => document.cookie.split("; ").find((row) => row.startsWith("kanovi_token="))?.split("=")[1];

    const apiRequest = async (path: string, options: RequestInit = {}) => {
    const token = getToken();

    if (!token) {
      throw new Error("Token login tidak ditemukan. Silakan login ulang.");
    }

    const headers: HeadersInit = {
      Authorization: `Bearer ${token}`,
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
    };

    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
      cache: "no-store",
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(data?.message || `Request gagal (${res.status})`);
    }

    return data;
  };


  const fetchMenus = async () => {
    try {
      const data = await apiRequest("/api/menus");
      setMenus(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("fetchMenus error:", error);
      toast.error(error instanceof Error ? error.message : "Gagal mengambil menu");
    }
  };

  const fetchCategories = async () => {
  try {
    const data = await apiRequest("/categories");
    setCategories(Array.isArray(data) ? data : []);
  } catch (error) {
    console.error("fetchCategories error:", error);
    toast.error(error instanceof Error ? error.message : "Gagal mengambil kategori");
  }
};

  const fetchIngredients = async () => {
  try {
    const data = await apiRequest("/api/ingredients");
    setIngredients(Array.isArray(data) ? data : []);
  } catch (error) {
    console.error("fetchIngredients error:", error);
    toast.error(error instanceof Error ? error.message : "Gagal mengambil ingredient");
  }
};

  const openRecipeModal = async (menu: Menu) => {
    setSelectedMenu(menu);
    setIsRecipeModalOpen(true);
    setIsRecipeLoading(true);

    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/api/menus/${menu.id}/recipe`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.message || "Gagal mengambil recipe");
      }

      const mappedItems =
        data?.items?.length > 0
          ? data.items.map((item: any) => ({
              ingredientId: String(item.ingredientId),
              amountNeeded: String(item.amountNeeded),
            }))
          : [{ ingredientId: "", amountNeeded: "" }];

      setRecipeItems(mappedItems);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Gagal mengambil recipe");
      setRecipeItems([{ ingredientId: "", amountNeeded: "" }]);
    } finally {
      setIsRecipeLoading(false);
    }
  };

  const closeRecipeModal = () => {
    setIsRecipeModalOpen(false);
    setSelectedMenu(null);
    setRecipeItems([{ ingredientId: "", amountNeeded: "" }]);
  };

  const updateRecipeItem = (
    index: number,
    field: "ingredientId" | "amountNeeded",
    value: string
  ) => {
    setRecipeItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const addRecipeRow = () => {
    setRecipeItems((prev) => [...prev, { ingredientId: "", amountNeeded: "" }]);
  };

  const removeRecipeRow = (index: number) => {
    setRecipeItems((prev) =>
      prev.length === 1
        ? [{ ingredientId: "", amountNeeded: "" }]
        : prev.filter((_, i) => i !== index)
    );
  };

  const saveRecipe = async () => {
    if (!selectedMenu) return;

    const activeRows = recipeItems.filter(
      (item) => item.ingredientId !== "" || item.amountNeeded !== ""
    );

    const hasPartialRow = activeRows.some(
      (item) => !item.ingredientId || !item.amountNeeded
    );

    if (hasPartialRow) {
      toast.error("Lengkapi semua baris recipe atau hapus baris kosong.");
      return;
    }

    const duplicateCheck = new Set<string>();
    for (const item of activeRows) {
      if (duplicateCheck.has(item.ingredientId)) {
        toast.error("Ingredient tidak boleh duplikat dalam satu menu.");
        return;
      }
      duplicateCheck.add(item.ingredientId);
    }

    const payload = {
      items: activeRows.map((item) => ({
        ingredientId: Number(item.ingredientId),
        amountNeeded: Number(item.amountNeeded),
      })),
    };

    const invalidAmount = payload.items.some((item) => item.amountNeeded <= 0);
    if (invalidAmount) {
      toast.error("amountNeeded harus lebih dari 0.");
      return;
    }

    setIsRecipeSaving(true);
    const toastId = toast.loading("Menyimpan recipe...");

    try {
      await apiRequest(`/api/menus/${selectedMenu.id}/recipe`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      toast.success("Recipe berhasil disimpan", { id: toastId });
      closeRecipeModal();
    } catch (error) {
      console.error("saveRecipe error:", error);
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan recipe", {
        id: toastId,
      });
    } finally {
      setIsRecipeSaving(false);
    }
  };

  const openDeleteModal = (id: number, name: string) => {
    setMenuToDelete({ id, name });
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!menuToDelete) return;

    setIsModalOpen(false);
    const toastId = toast.loading("Menghapus menu...");

    try {
      await apiRequest(`/api/menus/${menuToDelete.id}`, {
        method: "DELETE",
      });

      toast.success(`Menu ${menuToDelete.name} dihapus!`, { id: toastId });
      fetchMenus();
    } catch (error) {
      console.error("confirmDelete error:", error);
      toast.error(error instanceof Error ? error.message : "Gagal menghapus menu", {
        id: toastId,
      });
    } finally {
      setMenuToDelete(null);
    }
  };

  const openEditModal = (menu: Menu) => {
    setEditingMenu(menu);
    setEditName(menu.name);
    setEditPrice(String(menu.price));
    setEditCategoryId(menu.categoryId ? String(menu.categoryId) : "");
    setIsEditModalOpen(true);
  };

    const closeEditModal = () => {
  setIsEditModalOpen(false);
  setEditingMenu(null);
  setEditName("");
  setEditPrice("");
  setEditCategoryId("");
};


  const handleUpdateMenu = async () => {
    if (!editingMenu) return;

    const name = editName.trim();
    const price = Number(editPrice);

    if (!name) {
      toast.error("Nama menu wajib diisi.");
      return;
    }

    if (!Number.isFinite(price) || price <= 0) {
      toast.error("Harga menu harus lebih dari 0.");
      return;
    }

    setIsEditSaving(true);
    const toastId = toast.loading("Menyimpan perubahan menu...");

    try {
      await apiRequest(`/api/menus/${editingMenu.id}`, {
  method: "PUT",
  body: JSON.stringify({
    name,
    price,
    categoryId: editCategoryId ? Number(editCategoryId) : null,
  }),
});

      toast.success("Menu berhasil diupdate", { id: toastId });
      closeEditModal();
      fetchMenus();
    } catch (error) {
      console.error("handleUpdateMenu error:", error);
      toast.error(error instanceof Error ? error.message : "Gagal mengupdate menu", {
        id: toastId,
      });
    } finally {
      setIsEditSaving(false);
    }
  };

  useEffect(() => {
  if (hasLoadedRef.current) return;
  hasLoadedRef.current = true;

  fetchMenus();
  fetchIngredients();
  fetchCategories();
}, []);

const filteredMenus = menus.filter((menu) => {
  const matchSearch = menu.name.toLowerCase().includes(searchQuery.toLowerCase());
  const matchCategory =
    selectedCategory === "ALL"
      ? true
      : String(menu.categoryId ?? "") === selectedCategory;

  return matchSearch && matchCategory;
});

  return (
    <div className="max-w-5xl mx-auto w-full relative">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 md:mb-8 gap-4">
        <div className="w-full lg:w-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-kanovi-coffee dark:text-kanovi-bone">Daftar Menu</h1>
          <p className="text-sm md:text-base text-kanovi-coffee/70 dark:text-kanovi-cream/70 mt-1">Kelola harga dan produk kopi yang dijual.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row w-full lg:w-auto gap-3">
          <div className="relative w-full sm:w-56">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2.5 bg-kanovi-paper dark:bg-kanovi-darker border border-kanovi-cream dark:border-kanovi-darker/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-kanovi-wood text-kanovi-coffee dark:text-kanovi-bone text-sm">
              <option value="ALL">Semua Kategori</option>
              {categories.map((cat) => (
                <option key={cat.id} value={String(cat.id)}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* SEARCH BAR */}
          <div className="relative w-full sm:w-64">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-kanovi-wood dark:text-kanovi-cream/50">🔍</span>
            <input 
              type="text" 
              placeholder="Cari kopi..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-kanovi-paper dark:bg-kanovi-darker border border-kanovi-cream dark:border-kanovi-darker/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-kanovi-wood text-kanovi-coffee dark:text-kanovi-bone placeholder-kanovi-coffee/40 dark:placeholder-kanovi-cream/30 transition-shadow text-sm"
            />
            
          </div>

          {/* TOMBOL TAMBAH MENU (Warna Kayu / Karamel) */}
          <Link 
            href="/dashboard/menu/create"
            className="w-full sm:w-auto px-5 py-2.5 bg-kanovi-wood hover:bg-kanovi-coffee text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all flex justify-center items-center gap-2"
          >
            <span>+</span> Tambah Menu
          </Link>
        </div>
      </div>

      {/* BACKGROUND TABEL (Kertas / Putih Tulang) */}
      <div className="bg-kanovi-paper dark:bg-kanovi-darker rounded-xl shadow-sm border border-kanovi-cream/50 dark:border-white/5 overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-125"> 
            <thead>
              {/* HEADER TABEL YANG LEBIH MENTRENG & TEGAS */}
              <tr className="bg-kanovi-cream dark:bg-[#32251E] border-b-2 border-kanovi-wood/30 dark:border-white/10 text-kanovi-coffee dark:text-kanovi-cream text-xs md:text-sm uppercase tracking-wider shadow-sm">
                <th className="p-3 md:p-4 font-bold">ID</th>
                <th className="p-3 md:p-4 font-bold">Nama Menu</th>
                <th className="p-3 md:p-4 font-bold">Harga</th>
                <th className="p-3 md:p-4 font-bold">Kategori</th>
                <th className="p-3 md:p-4 font-bold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-kanovi-cream/40 dark:divide-white/5 text-sm md:text-base">
              {filteredMenus.map((menu: any) => (
                // HOVER TABEL AMAN DARI FLASHBANG
                <tr key={menu.id} className="hover:bg-kanovi-cream/20 dark:hover:bg-white/5 transition-colors">
                  <td className="p-3 md:p-4 text-kanovi-coffee/60 dark:text-kanovi-cream/50">#{menu.id}</td>
                  <td className="p-3 md:p-4 font-semibold text-kanovi-coffee dark:text-kanovi-bone">{menu.name}</td>
                  <td className="p-3 md:p-4 text-kanovi-wood dark:text-kanovi-cream">Rp {menu.price.toLocaleString("id-ID")}</td>
                  <td className="p-3 md:p-4 text-kanovi-coffee dark:text-kanovi-bone">{menu.category?.name ?? "-"}</td>
                  <td className="p-3 md:p-4 text-center">
                    <div className="flex justify-center items-center gap-2">
                      <button
                        onClick={() => openEditModal(menu)}
                        className="px-3 py-1.5 bg-kanovi-cream/40 hover:bg-kanovi-cream/70 dark:bg-white/5 dark:hover:bg-white/10 text-kanovi-coffee dark:text-kanovi-cream text-xs md:text-sm font-medium rounded-md transition-colors"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => openRecipeModal(menu)}
                        className="px-3 py-1.5 bg-kanovi-wood/10 hover:bg-kanovi-wood/20 text-kanovi-wood dark:bg-kanovi-wood/20 dark:hover:bg-kanovi-wood/30 dark:text-kanovi-cream text-xs md:text-sm font-medium rounded-md transition-colors"
                      >
                        Resep
                      </button>

                      <button
                        onClick={() => openDeleteModal(menu.id, menu.name)}
                        className="px-3 py-1.5 bg-kanovi-danger/10 hover:bg-kanovi-danger/20 text-kanovi-danger dark:bg-kanovi-danger/20 dark:hover:bg-kanovi-danger/40 dark:text-red-300 text-xs md:text-sm font-medium rounded-md transition-colors"
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredMenus.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 md:p-8 text-center text-kanovi-coffee/50 dark:text-kanovi-cream/40 italic text-sm md:text-base">
                    Menu tidak ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL HAPUS */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-kanovi-paper dark:bg-kanovi-darker rounded-2xl shadow-xl w-full max-w-sm p-6 transform scale-100 transition-all border border-kanovi-cream/50 dark:border-white/5">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-kanovi-danger/10 dark:bg-kanovi-danger/20 rounded-full mb-4">
              <span className="text-kanovi-danger dark:text-red-400 text-2xl">🗑️</span>
            </div>
            <h3 className="text-xl font-bold text-center text-kanovi-coffee dark:text-kanovi-bone mb-2">Hapus Menu?</h3>
            <p className="text-center text-kanovi-coffee/70 dark:text-kanovi-cream/70 mb-6 text-sm">
              Yakin ingin menghapus <span className="font-bold text-kanovi-coffee dark:text-white">{menuToDelete?.name}</span>?
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-4 py-2.5 bg-kanovi-cream/40 hover:bg-kanovi-cream/70 dark:bg-white/5 dark:hover:bg-white/10 text-kanovi-coffee dark:text-kanovi-cream font-medium rounded-xl transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 px-4 py-2.5 bg-kanovi-danger hover:opacity-90 text-white font-medium rounded-xl shadow-sm hover:shadow transition-all"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {isEditModalOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="bg-white dark:bg-kanovi-darker rounded-2xl shadow-2xl w-full max-w-md p-6 border border-kanovi-cream/50 dark:border-white/5">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h3 className="text-2xl font-bold text-kanovi-coffee dark:text-kanovi-bone">
                Edit Menu
              </h3>
              <p className="text-sm text-kanovi-coffee/70 dark:text-kanovi-cream/70 mt-1">
                {editingMenu ? `ID Menu: #${editingMenu.id}` : ""}
              </p>
            </div>

            <button
              onClick={closeEditModal}
              className="text-2xl text-kanovi-coffee dark:text-kanovi-bone opacity-50 hover:opacity-100"
            >
              &times;
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-kanovi-coffee dark:text-kanovi-bone">
                Nama Menu
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Masukkan nama menu"
                className="w-full px-4 py-3 bg-kanovi-paper dark:bg-black/20 border border-kanovi-cream dark:border-white/10 rounded-xl text-kanovi-coffee dark:text-kanovi-bone"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-kanovi-coffee dark:text-kanovi-bone">
                Harga
              </label>
              <input
                type="number"
                min="1"
                value={editPrice}
                onChange={(e) => setEditPrice(e.target.value)}
                placeholder="0"
                className="w-full px-4 py-3 bg-kanovi-paper dark:bg-black/20 border border-kanovi-cream dark:border-white/10 rounded-xl text-kanovi-coffee dark:text-kanovi-bone"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={closeEditModal}
              className="px-5 py-3 bg-kanovi-cream/40 hover:bg-kanovi-cream/70 dark:bg-white/5 dark:hover:bg-white/10 text-kanovi-coffee dark:text-kanovi-cream font-medium rounded-xl transition-colors"
            >
              Batal
            </button>

            <button
              type="button"
              onClick={handleUpdateMenu}
              disabled={isEditSaving}
              className="px-5 py-3 bg-kanovi-wood hover:bg-kanovi-coffee text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
            >
              {isEditSaving ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </div>
      </div>
    )}

      {isRecipeModalOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
    <div className="bg-white dark:bg-kanovi-darker rounded-2xl shadow-2xl w-full max-w-3xl p-6 border border-kanovi-cream/50 dark:border-white/5">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h3 className="text-2xl font-bold text-kanovi-coffee dark:text-kanovi-bone">
            Kelola Resep
          </h3>
          <p className="text-sm text-kanovi-coffee/70 dark:text-kanovi-cream/70 mt-1">
            {selectedMenu ? `Menu: ${selectedMenu.name}` : ""}
          </p>
        </div>

        <button
          onClick={closeRecipeModal}
          className="text-2xl text-kanovi-coffee dark:text-kanovi-bone opacity-50 hover:opacity-100"
        >
          &times;
        </button>
      </div>

      {isRecipeLoading ? (
        <div className="py-12 text-center text-kanovi-coffee/70 dark:text-kanovi-cream/70">
          Memuat recipe...
        </div>
      ) : (
        <>
          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {recipeItems.map((item, index) => {
              const selectedIngredient = ingredients.find(
                (ingredient) => ingredient.id === Number(item.ingredientId)
              );

              return (
                <div
                  key={index}
                  className="grid grid-cols-1 md:grid-cols-[1.6fr_1fr_1fr_auto] gap-3 items-end rounded-xl border border-kanovi-cream/50 dark:border-white/5 p-4"
                >
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-kanovi-coffee dark:text-kanovi-bone">
                      Ingredient
                    </label>
                    <select
                      value={item.ingredientId}
                      onChange={(e) =>
                        updateRecipeItem(index, "ingredientId", e.target.value)
                      }
                      className="w-full px-4 py-3 bg-kanovi-paper dark:bg-black/20 border border-kanovi-cream dark:border-white/10 rounded-xl text-kanovi-coffee dark:text-kanovi-bone"
                    >
                      <option value="">Pilih ingredient</option>
                      {ingredients.map((ingredient) => (
                        <option key={ingredient.id} value={ingredient.id}>
                          {ingredient.name} ({ingredient.stock} {ingredient.unit})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2 text-kanovi-coffee dark:text-kanovi-bone">
                      Amount Needed
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={item.amountNeeded}
                      onChange={(e) =>
                        updateRecipeItem(index, "amountNeeded", e.target.value)
                      }
                      placeholder="0"
                      className="w-full px-4 py-3 bg-kanovi-paper dark:bg-black/20 border border-kanovi-cream dark:border-white/10 rounded-xl text-kanovi-coffee dark:text-kanovi-bone"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2 text-kanovi-coffee dark:text-kanovi-bone">
                      Unit
                    </label>
                    <div className="w-full px-4 py-3 bg-kanovi-bone dark:bg-black/10 border border-kanovi-cream dark:border-white/10 rounded-xl text-kanovi-coffee/80 dark:text-kanovi-cream/80">
                      {selectedIngredient?.unit || "-"}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeRecipeRow(index)}
                    className="px-4 py-3 bg-kanovi-danger/10 hover:bg-kanovi-danger/20 text-kanovi-danger rounded-xl font-medium transition-colors"
                  >
                    Hapus
                  </button>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-3 mt-4">
            <button
              type="button"
              onClick={addRecipeRow}
              className="px-4 py-2.5 bg-kanovi-cream/40 hover:bg-kanovi-cream/70 dark:bg-white/5 dark:hover:bg-white/10 text-kanovi-coffee dark:text-kanovi-cream font-medium rounded-xl transition-colors"
            >
              + Tambah Baris
            </button>

            <button
              type="button"
              onClick={() =>
                setRecipeItems([{ ingredientId: "", amountNeeded: "" }])
              }
              className="px-4 py-2.5 bg-kanovi-danger/10 hover:bg-kanovi-danger/20 text-kanovi-danger font-medium rounded-xl transition-colors"
            >
              Kosongkan Form
            </button>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={closeRecipeModal}
              className="px-5 py-3 bg-kanovi-cream/40 hover:bg-kanovi-cream/70 dark:bg-white/5 dark:hover:bg-white/10 text-kanovi-coffee dark:text-kanovi-cream font-medium rounded-xl transition-colors"
            >
              Batal
            </button>

            <button
              type="button"
              onClick={saveRecipe}
              disabled={isRecipeSaving}
              className="px-5 py-3 bg-kanovi-wood hover:bg-kanovi-coffee text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
            >
              {isRecipeSaving ? "Menyimpan..." : "Simpan Resep"}
            </button>
          </div>
        </>
      )}
    </div>
  </div>
)}
</div>
  );
}