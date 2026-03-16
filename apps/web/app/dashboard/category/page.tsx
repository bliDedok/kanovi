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

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3001";

export default function CategoryListPage() {
  const hasLoadedRef = useRef(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<{
    id: number;
    name: string;
  } | null>(null);

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

  const fetchCategories = async () => {
    try {
      const data = await apiRequest("/categories");
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("fetchCategories error:", error);
      toast.error(
        error instanceof Error ? error.message : "Gagal mengambil kategori"
      );
    }
  };

  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    fetchCategories();
  }, []);

  const openDeleteModal = (id: number, name: string) => {
    setCategoryToDelete({ id, name });
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!categoryToDelete) return;

    setIsModalOpen(false);
    const toastId = toast.loading("Menghapus kategori...");

    try {
      await apiRequest(`/categories/${categoryToDelete.id}`, {
        method: "DELETE",
      });

      toast.success(`Kategori ${categoryToDelete.name} dihapus!`, {
        id: toastId,
      });

      fetchCategories();
    } catch (error) {
      console.error("confirmDelete error:", error);
      toast.error(
        error instanceof Error ? error.message : "Gagal menghapus kategori",
        { id: toastId }
      );
    } finally {
      setCategoryToDelete(null);
    }
  };

  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto w-full relative">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 md:mb-8 gap-4">
        <div className="w-full lg:w-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-kanovi-coffee dark:text-kanovi-bone">
            Daftar Kategori
          </h1>
          <p className="text-sm md:text-base text-kanovi-coffee/70 dark:text-kanovi-cream/70 mt-1">
            Kelola kategori menu untuk makanan, minuman, dan lainnya.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row w-full lg:w-auto gap-3">
          <div className="relative w-full sm:w-64">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-kanovi-wood dark:text-kanovi-cream/50">
              🔍
            </span>
            <input
              type="text"
              placeholder="Cari kategori..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-kanovi-paper dark:bg-kanovi-darker border border-kanovi-cream dark:border-kanovi-darker/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-kanovi-wood text-kanovi-coffee dark:text-kanovi-bone placeholder-kanovi-coffee/40 dark:placeholder-kanovi-cream/30 transition-shadow text-sm"
            />
          </div>

          <Link
            href="/dashboard/category/create"
            className="w-full sm:w-auto px-5 py-2.5 bg-kanovi-wood hover:bg-kanovi-coffee text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all flex justify-center items-center gap-2"
          >
            <span>+</span> Tambah Kategori
          </Link>
        </div>
      </div>

      <div className="bg-kanovi-paper dark:bg-kanovi-darker rounded-xl shadow-sm border border-kanovi-cream/50 dark:border-white/5 overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-kanovi-cream dark:bg-[#32251E] border-b-2 border-kanovi-wood/30 dark:border-white/10 text-kanovi-coffee dark:text-kanovi-cream text-xs md:text-sm uppercase tracking-wider shadow-sm">
                <th className="p-3 md:p-4 font-bold">ID</th>
                <th className="p-3 md:p-4 font-bold">Nama Kategori</th>
                <th className="p-3 md:p-4 font-bold">Slug</th>
                <th className="p-3 md:p-4 font-bold">Status</th>
                <th className="p-3 md:p-4 font-bold">Urutan</th>
                <th className="p-3 md:p-4 font-bold text-center">Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-kanovi-cream/40 dark:divide-white/5 text-sm md:text-base">
              {filteredCategories.map((category) => (
                <tr
                  key={category.id}
                  className="hover:bg-kanovi-cream/20 dark:hover:bg-white/5 transition-colors"
                >
                  <td className="p-3 md:p-4 text-kanovi-coffee/60 dark:text-kanovi-cream/50">
                    #{category.id}
                  </td>
                  <td className="p-3 md:p-4 font-semibold text-kanovi-coffee dark:text-kanovi-bone">
                    {category.name}
                  </td>
                  <td className="p-3 md:p-4 text-kanovi-wood dark:text-kanovi-cream">
                    {category.slug}
                  </td>
                  <td className="p-3 md:p-4 text-kanovi-coffee dark:text-kanovi-bone">
                    {category.isActive ? "Aktif" : "Nonaktif"}
                  </td>
                  <td className="p-3 md:p-4 text-kanovi-coffee dark:text-kanovi-bone">
                    {category.sortOrder ?? 0}
                  </td>

                  <td className="p-3 md:p-4 text-center">
                    <div className="flex justify-center items-center gap-2">
                      <Link
                        href={`/dashboard/category/${category.id}/edit`}
                        className="px-3 py-1.5 bg-kanovi-cream/40 hover:bg-kanovi-cream/70 dark:bg-white/5 dark:hover:bg-white/10 text-kanovi-coffee dark:text-kanovi-cream text-xs md:text-sm font-medium rounded-md transition-colors"
                      >
                        Edit
                      </Link>

                      <button
                        onClick={() =>
                          openDeleteModal(category.id, category.name)
                        }
                        className="px-3 py-1.5 bg-kanovi-danger/10 hover:bg-kanovi-danger/20 text-kanovi-danger dark:bg-kanovi-danger/20 dark:hover:bg-kanovi-danger/40 dark:text-red-300 text-xs md:text-sm font-medium rounded-md transition-colors"
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredCategories.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="p-6 md:p-8 text-center text-kanovi-coffee/50 dark:text-kanovi-cream/40 italic text-sm md:text-base"
                  >
                    Kategori tidak ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-kanovi-paper dark:bg-kanovi-darker rounded-2xl shadow-xl w-full max-w-sm p-6 transform scale-100 transition-all border border-kanovi-cream/50 dark:border-white/5">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-kanovi-danger/10 dark:bg-kanovi-danger/20 rounded-full mb-4">
              <span className="text-kanovi-danger dark:text-red-400 text-2xl">
                🗑️
              </span>
            </div>

            <h3 className="text-xl font-bold text-center text-kanovi-coffee dark:text-kanovi-bone mb-2">
              Hapus Kategori?
            </h3>

            <p className="text-center text-kanovi-coffee/70 dark:text-kanovi-cream/70 mb-6 text-sm">
              Yakin ingin menghapus{" "}
              <span className="font-bold text-kanovi-coffee dark:text-white">
                {categoryToDelete?.name}
              </span>
              ?
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
    </div>
  );
}