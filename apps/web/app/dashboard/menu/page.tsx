"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  AlertTriangle,
  BookOpen,
  Edit3,
  Hash,
  Plus,
  Search,
  Tag,
  Trash2,
  X,
} from "lucide-react";

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
  const [menuToDelete, setMenuToDelete] = useState<{
    id: number;
    name: string;
  } | null>(null);

  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<Menu | null>(null);
  const [recipeItems, setRecipeItems] = useState<RecipeRow[]>([
    { ingredientId: "", amountNeeded: "" },
  ]);
  const [isRecipeLoading, setIsRecipeLoading] = useState(false);
  const [isRecipeSaving, setIsRecipeSaving] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [isEditSaving, setIsEditSaving] = useState(false);

  const getToken = () =>
    document.cookie
      .split("; ")
      .find((row) => row.startsWith("kanovi_token="))
      ?.split("=")[1];

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

  const formatRupiah = (value: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value);

  const fieldClass =
    "w-full rounded-2xl bg-[#edf2f4] px-4 py-3 text-sm font-bold text-[#20272c] shadow-[inset_6px_6px_12px_rgba(130,145,152,0.20),inset_-6px_-6px_12px_rgba(255,255,255,0.92)] outline-none placeholder:text-[#8a969c] dark:bg-white/[0.06] dark:text-white dark:shadow-[inset_6px_6px_12px_rgba(0,0,0,0.28),inset_-6px_-6px_12px_rgba(255,255,255,0.035)] dark:placeholder:text-white/35";

  const softButtonClass =
    "rounded-2xl bg-[#edf2f4] px-4 py-3 text-sm font-black text-[#20272c] shadow-[7px_7px_16px_rgba(130,145,152,0.18),-7px_-7px_16px_rgba(255,255,255,0.9)] transition-all active:shadow-[inset_5px_5px_10px_rgba(130,145,152,0.22),inset_-5px_-5px_10px_rgba(255,255,255,0.9)] dark:bg-white/[0.07] dark:text-white dark:shadow-[7px_7px_16px_rgba(0,0,0,0.26),-4px_-4px_12px_rgba(255,255,255,0.03)] dark:active:shadow-[inset_5px_5px_10px_rgba(0,0,0,0.28),inset_-5px_-5px_10px_rgba(255,255,255,0.035)]";

  return (
    <div className="mx-auto w-full max-w-6xl animate-fade-in space-y-6">
      <section className="rounded-[2.2rem] border border-white/70 bg-[#edf2f4] p-6 shadow-[18px_18px_42px_rgba(130,145,152,0.20),-14px_-14px_34px_rgba(255,255,255,0.92)] dark:border-white/10 dark:bg-white/[0.055] dark:shadow-[18px_18px_42px_rgba(0,0,0,0.32),-8px_-8px_24px_rgba(255,255,255,0.035)] md:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-[#20272c] dark:text-[#f7efe7] md:text-4xl">
              Daftar Menu
            </h1>

            <p className="mt-3 max-w-2xl text-sm font-semibold leading-relaxed text-[#6f7a80] dark:text-white/55 md:text-base">
              Kelola daftar menu, kategori, harga, dan resep bahan baku.
            </p>
          </div>

          <Link
            href="/dashboard/menu/create"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#edf2f4] px-5 py-3 text-sm font-black text-[#20272c] shadow-[8px_8px_18px_rgba(130,145,152,0.2),-8px_-8px_18px_rgba(255,255,255,0.95)] transition-all hover:-translate-y-0.5 active:translate-y-0 active:shadow-[inset_5px_5px_10px_rgba(130,145,152,0.22),inset_-5px_-5px_10px_rgba(255,255,255,0.92)] dark:bg-white/[0.07] dark:text-white dark:shadow-[8px_8px_18px_rgba(0,0,0,0.28),-5px_-5px_14px_rgba(255,255,255,0.035)] dark:active:shadow-[inset_5px_5px_10px_rgba(0,0,0,0.28),inset_-5px_-5px_10px_rgba(255,255,255,0.035)]"
          >
            <Plus className="h-5 w-5" />
            Tambah Menu
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-[1.8rem] bg-[#edf2f4] p-5 shadow-[12px_12px_28px_rgba(130,145,152,0.18),-10px_-10px_24px_rgba(255,255,255,0.92)] dark:bg-white/[0.055] dark:shadow-[12px_12px_28px_rgba(0,0,0,0.28),-6px_-6px_18px_rgba(255,255,255,0.035)]">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8a969c] dark:text-white/40">
            Total Menu
          </p>
          <p className="mt-2 text-3xl font-black">{menus.length}</p>
        </div>

        <div className="rounded-[1.8rem] bg-[#edf2f4] p-5 shadow-[12px_12px_28px_rgba(130,145,152,0.18),-10px_-10px_24px_rgba(255,255,255,0.92)] dark:bg-white/[0.055] dark:shadow-[12px_12px_28px_rgba(0,0,0,0.28),-6px_-6px_18px_rgba(255,255,255,0.035)]">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8a969c] dark:text-white/40">
            Kategori
          </p>
          <p className="mt-2 text-3xl font-black">{categories.length}</p>
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-[2rem] bg-[#edf2f4] p-4 shadow-[12px_12px_28px_rgba(130,145,152,0.18),-10px_-10px_24px_rgba(255,255,255,0.92)] dark:bg-white/[0.055] dark:shadow-[12px_12px_28px_rgba(0,0,0,0.28),-6px_-6px_18px_rgba(255,255,255,0.035)] md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8a969c] dark:text-white/40" />
          <input
            type="text"
            placeholder="Cari menu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`${fieldClass} pl-12`}
          />
        </div>

        <div className="relative w-full md:max-w-xs">
          <Tag className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8a969c] dark:text-white/40" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className={`${fieldClass} appearance-none pl-12 text-[#20272c] dark:text-white`}
          >
            <option className="bg-[#edf2f4] text-[#20272c]" value="ALL">
              Semua Kategori
            </option>

            {categories.map((cat) => (
              <option
                key={cat.id}
                value={String(cat.id)}
                className="bg-[#edf2f4] text-[#20272c]"
              >
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="overflow-hidden rounded-[2.2rem] bg-[#edf2f4] p-3 shadow-[18px_18px_42px_rgba(130,145,152,0.20),-14px_-14px_34px_rgba(255,255,255,0.92)] dark:bg-white/[0.055] dark:shadow-[18px_18px_42px_rgba(0,0,0,0.32),-8px_-8px_24px_rgba(255,255,255,0.035)]">
        <div className="overflow-x-auto rounded-[1.7rem] bg-[#edf2f4] shadow-[inset_7px_7px_14px_rgba(130,145,152,0.16),inset_-7px_-7px_14px_rgba(255,255,255,0.88)] dark:bg-white/[0.035] dark:shadow-[inset_7px_7px_14px_rgba(0,0,0,0.24),inset_-7px_-7px_14px_rgba(255,255,255,0.03)]">
          <table className="w-full min-w-[860px] border-collapse text-left text-sm font-bold">
            <thead>
              <tr className="text-xs font-black uppercase tracking-[0.18em] text-[#7a858b] dark:text-white/40">
                <th className="px-5 py-5">
                  <span className="inline-flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    ID
                  </span>
                </th>
                <th className="px-5 py-5">Nama Menu</th>
                <th className="px-5 py-5">Kategori</th>
                <th className="px-5 py-5">Harga</th>
                <th className="px-5 py-5 text-center">Aksi</th>
              </tr>
            </thead>

            <tbody>
              {filteredMenus.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-12 text-center text-[#8a969c] dark:text-white/40"
                  >
                    Menu tidak ditemukan.
                  </td>
                </tr>
              ) : (
                filteredMenus.map((menu) => (
                  <tr
                    key={menu.id}
                    className="border-t border-white/50 transition-colors hover:bg-white/30 dark:border-white/5 dark:hover:bg-white/[0.035]"
                  >
                    <td className="px-5 py-4 text-[#8a969c] dark:text-white/40">
                      #{menu.id}
                    </td>

                    <td className="px-5 py-4 text-[#20272c] dark:text-[#f7efe7]">
                      {menu.name}
                    </td>

                    <td className="px-5 py-4 text-[#6f7a80] dark:text-white/50">
                      {menu.category?.name || "-"}
                    </td>

                    <td className="px-5 py-4 text-[#20272c] dark:text-[#f7efe7]">
                      {formatRupiah(menu.price)}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        <button
                          onClick={() => openEditModal(menu)}
                          className="inline-flex items-center gap-2 rounded-xl bg-[#edf2f4] px-3 py-2 text-xs font-black text-[#20272c] shadow-[5px_5px_11px_rgba(130,145,152,0.18),-5px_-5px_11px_rgba(255,255,255,0.9)] transition-all active:shadow-[inset_4px_4px_8px_rgba(130,145,152,0.22),inset_-4px_-4px_8px_rgba(255,255,255,0.9)] dark:bg-white/[0.07] dark:text-white dark:shadow-[5px_5px_11px_rgba(0,0,0,0.24),-3px_-3px_9px_rgba(255,255,255,0.03)]"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          Edit
                        </button>

                        <button
                          onClick={() => openRecipeModal(menu)}
                          className="inline-flex items-center gap-2 rounded-xl bg-[#edf2f4] px-3 py-2 text-xs font-black text-[#20272c] shadow-[5px_5px_11px_rgba(130,145,152,0.18),-5px_-5px_11px_rgba(255,255,255,0.9)] transition-all active:shadow-[inset_4px_4px_8px_rgba(130,145,152,0.22),inset_-4px_-4px_8px_rgba(255,255,255,0.9)] dark:bg-white/[0.07] dark:text-white dark:shadow-[5px_5px_11px_rgba(0,0,0,0.24),-3px_-3px_9px_rgba(255,255,255,0.03)]"
                        >
                          <BookOpen className="h-3.5 w-3.5" />
                          Resep
                        </button>

                        <button
                          onClick={() => openDeleteModal(menu.id, menu.name)}
                          className="inline-flex items-center gap-2 rounded-xl bg-[#edf2f4] px-3 py-2 text-xs font-black text-red-500 shadow-[5px_5px_11px_rgba(130,145,152,0.18),-5px_-5px_11px_rgba(255,255,255,0.9)] transition-all active:shadow-[inset_4px_4px_8px_rgba(130,145,152,0.22),inset_-4px_-4px_8px_rgba(255,255,255,0.9)] dark:bg-white/[0.07] dark:text-red-300 dark:shadow-[5px_5px_11px_rgba(0,0,0,0.24),-3px_-3px_9px_rgba(255,255,255,0.03)]"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-[2rem] bg-[#edf2f4] p-6 shadow-[22px_22px_52px_rgba(0,0,0,0.28),-12px_-12px_30px_rgba(255,255,255,0.30)] dark:bg-[#2f1a13] dark:shadow-[22px_22px_52px_rgba(0,0,0,0.45),-7px_-7px_20px_rgba(255,255,255,0.035)]">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-5 top-5 rounded-full p-1 text-[#8a969c] hover:text-[#20272c] dark:hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#edf2f4] text-red-500 shadow-[inset_5px_5px_10px_rgba(130,145,152,0.2),inset_-5px_-5px_10px_rgba(255,255,255,0.9)] dark:bg-white/[0.07] dark:text-red-300 dark:shadow-[inset_5px_5px_10px_rgba(0,0,0,0.28),inset_-5px_-5px_10px_rgba(255,255,255,0.035)]">
              <AlertTriangle className="h-7 w-7" />
            </div>

            <h3 className="text-center text-xl font-black text-[#20272c] dark:text-[#f7efe7]">
              Hapus Menu?
            </h3>

            <p className="mt-2 text-center text-sm font-semibold text-[#6f7a80] dark:text-white/55">
              Yakin ingin menghapus{" "}
              <span className="font-black text-[#20272c] dark:text-white">
                {menuToDelete?.name}
              </span>
              ?
            </p>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className={softButtonClass + " flex-1"}
              >
                Batal
              </button>

              <button
                onClick={confirmDelete}
                className="flex-1 rounded-2xl bg-red-500 px-4 py-3 text-sm font-black text-white shadow-[7px_7px_16px_rgba(130,145,152,0.18)] transition-all active:scale-[0.98]"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-[2rem] bg-[#edf2f4] p-6 shadow-[22px_22px_52px_rgba(0,0,0,0.28),-12px_-12px_30px_rgba(255,255,255,0.30)] dark:bg-[#2f1a13] dark:shadow-[22px_22px_52px_rgba(0,0,0,0.45),-7px_-7px_20px_rgba(255,255,255,0.035)]">
            <button
              onClick={closeEditModal}
              className="absolute right-5 top-5 rounded-full p-1 text-[#8a969c] hover:text-[#20272c] dark:hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-2xl font-black text-[#20272c] dark:text-[#f7efe7]">
              Edit Menu
            </h3>

            <p className="mt-1 text-sm font-semibold text-[#6f7a80] dark:text-white/50">
              {editingMenu ? `ID Menu: #${editingMenu.id}` : ""}
            </p>

            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-black text-[#20272c] dark:text-[#f7efe7]">
                  Nama Menu
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Masukkan nama menu"
                  className={fieldClass}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-[#20272c] dark:text-[#f7efe7]">
                  Harga
                </label>
                <input
                  type="number"
                  min="1"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  placeholder="0"
                  className={fieldClass}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-[#20272c] dark:text-[#f7efe7]">
                  Kategori
                </label>
                <select
                  value={editCategoryId}
                  onChange={(e) => setEditCategoryId(e.target.value)}
                  className={fieldClass}
                >
                  <option value="">Tanpa kategori</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={String(cat.id)}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={closeEditModal} className={softButtonClass}>
                Batal
              </button>

              <button
                type="button"
                onClick={handleUpdateMenu}
                disabled={isEditSaving}
                className="rounded-2xl bg-[#20272c] px-5 py-3 text-sm font-black text-white transition-all active:scale-[0.98] disabled:opacity-50 dark:bg-white dark:text-[#311B14]"
              >
                {isEditSaving ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isRecipeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
          <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] bg-[#edf2f4] p-6 shadow-[22px_22px_52px_rgba(0,0,0,0.28),-12px_-12px_30px_rgba(255,255,255,0.30)] dark:bg-[#2f1a13] dark:shadow-[22px_22px_52px_rgba(0,0,0,0.45),-7px_-7px_20px_rgba(255,255,255,0.035)]">
            <button
              onClick={closeRecipeModal}
              className="absolute right-5 top-5 rounded-full p-1 text-[#8a969c] hover:text-[#20272c] dark:hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="pr-10">
              <div className="mb-4 inline-flex items-center gap-2 rounded-2xl bg-[#edf2f4] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#6f7a80] shadow-[6px_6px_14px_rgba(130,145,152,0.18),-6px_-6px_14px_rgba(255,255,255,0.9)] dark:bg-white/[0.07] dark:text-white/50 dark:shadow-[6px_6px_14px_rgba(0,0,0,0.24),-4px_-4px_12px_rgba(255,255,255,0.03)]">
                <BookOpen className="h-4 w-4" />
                Recipe Builder
              </div>

              <h3 className="text-2xl font-black text-[#20272c] dark:text-[#f7efe7]">
                Atur Resep Menu
              </h3>

              <p className="mt-1 text-sm font-semibold text-[#6f7a80] dark:text-white/50">
                {selectedMenu ? selectedMenu.name : ""}
              </p>
            </div>

            {isRecipeLoading ? (
              <div className="mt-8 rounded-[1.7rem] bg-[#edf2f4] p-8 text-center text-sm font-black text-[#8a969c] shadow-[inset_7px_7px_14px_rgba(130,145,152,0.18),inset_-7px_-7px_14px_rgba(255,255,255,0.9)] dark:bg-white/[0.055] dark:text-white/45 dark:shadow-[inset_7px_7px_14px_rgba(0,0,0,0.25),inset_-7px_-7px_14px_rgba(255,255,255,0.035)]">
                Mengambil recipe...
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {recipeItems.map((item, index) => (
                  <div
                    key={index}
                    className="grid gap-3 rounded-[1.6rem] bg-[#edf2f4] p-4 shadow-[inset_6px_6px_12px_rgba(130,145,152,0.18),inset_-6px_-6px_12px_rgba(255,255,255,0.9)] dark:bg-white/[0.055] dark:shadow-[inset_6px_6px_12px_rgba(0,0,0,0.25),inset_-6px_-6px_12px_rgba(255,255,255,0.035)] md:grid-cols-[1fr_180px_auto]"
                  >
                    <div>
                      <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-[#8a969c] dark:text-white/40">
                        Ingredient
                      </label>

                      <select
                        value={item.ingredientId}
                        onChange={(e) =>
                          updateRecipeItem(index, "ingredientId", e.target.value)
                        }
                        className={fieldClass}
                      >
                        <option value="">Pilih ingredient</option>
                        {ingredients.map((ingredient) => (
                          <option key={ingredient.id} value={ingredient.id}>
                            {ingredient.name} — stok {ingredient.stock}{" "}
                            {ingredient.unit}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-[#8a969c] dark:text-white/40">
                        Amount
                      </label>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.amountNeeded}
                        onChange={(e) =>
                          updateRecipeItem(index, "amountNeeded", e.target.value)
                        }
                        placeholder="0"
                        className={fieldClass}
                      />
                    </div>

                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => removeRecipeRow(index)}
                        className="flex h-12 w-full items-center justify-center rounded-2xl bg-[#edf2f4] text-red-500 shadow-[7px_7px_16px_rgba(130,145,152,0.18),-7px_-7px_16px_rgba(255,255,255,0.9)] transition-all active:shadow-[inset_5px_5px_10px_rgba(130,145,152,0.22),inset_-5px_-5px_10px_rgba(255,255,255,0.9)] dark:bg-white/[0.07] dark:text-red-300 dark:shadow-[7px_7px_16px_rgba(0,0,0,0.26),-4px_-4px_12px_rgba(255,255,255,0.03)]"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addRecipeRow}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#edf2f4] px-4 py-3 text-sm font-black text-[#20272c] shadow-[7px_7px_16px_rgba(130,145,152,0.18),-7px_-7px_16px_rgba(255,255,255,0.9)] transition-all hover:-translate-y-0.5 active:translate-y-0 active:shadow-[inset_5px_5px_10px_rgba(130,145,152,0.22),inset_-5px_-5px_10px_rgba(255,255,255,0.9)] dark:bg-white/[0.07] dark:text-white dark:shadow-[7px_7px_16px_rgba(0,0,0,0.26),-4px_-4px_12px_rgba(255,255,255,0.03)]"
                >
                  <Plus className="h-4 w-4" />
                  Tambah Baris
                </button>
              </div>
            )}

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeRecipeModal}
                className={softButtonClass}
              >
                Batal
              </button>

              <button
                type="button"
                onClick={saveRecipe}
                disabled={isRecipeSaving || isRecipeLoading}
                className="rounded-2xl bg-[#20272c] px-5 py-3 text-sm font-black text-white transition-all active:scale-[0.98] disabled:opacity-50 dark:bg-white dark:text-[#311B14]"
              >
                {isRecipeSaving ? "Menyimpan..." : "Simpan Recipe"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}