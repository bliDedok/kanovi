"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  AlertTriangle,
  CheckCircle2,
  Edit3,
  Hash,
  ListOrdered,
  Plus,
  Search,
  Tag,
  Trash2,
  X,
  XCircle,
} from "lucide-react";

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

  const softButtonClass =
    "rounded-2xl bg-[#edf2f4] px-4 py-3 text-sm font-black text-[#20272c] shadow-[7px_7px_16px_rgba(130,145,152,0.18),-7px_-7px_16px_rgba(255,255,255,0.9)] transition-all active:shadow-[inset_5px_5px_10px_rgba(130,145,152,0.22),inset_-5px_-5px_10px_rgba(255,255,255,0.9)] dark:bg-white/[0.07] dark:text-white dark:shadow-[7px_7px_16px_rgba(0,0,0,0.26),-4px_-4px_12px_rgba(255,255,255,0.03)] dark:active:shadow-[inset_5px_5px_10px_rgba(0,0,0,0.28),inset_-5px_-5px_10px_rgba(255,255,255,0.035)]";

  return (
    <div className="mx-auto w-full max-w-6xl animate-fade-in space-y-6">
      <section className="rounded-[2.2rem] border border-white/70 bg-[#edf2f4] p-6 shadow-[18px_18px_42px_rgba(130,145,152,0.20),-14px_-14px_34px_rgba(255,255,255,0.92)] dark:border-white/10 dark:bg-white/[0.055] dark:shadow-[18px_18px_42px_rgba(0,0,0,0.32),-8px_-8px_24px_rgba(255,255,255,0.035)] md:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-[#20272c] dark:text-[#f7efe7] md:text-4xl">
              Daftar Kategori
            </h1>

            <p className="mt-3 max-w-2xl text-sm font-semibold leading-relaxed text-[#6f7a80] dark:text-white/55 md:text-base">
              Kelola kategori menu untuk makanan, minuman, dan lainnya.
            </p>
          </div>

          <div className="grid w-full gap-3 sm:grid-cols-[1fr_auto] lg:w-auto">
            <div className="relative min-w-0 sm:w-72">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8a969c] dark:text-white/40" />

              <input
                type="text"
                placeholder="Cari kategori..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-2xl bg-[#edf2f4] py-3 pl-12 pr-4 text-sm font-bold text-[#20272c] shadow-[inset_6px_6px_12px_rgba(130,145,152,0.20),inset_-6px_-6px_12px_rgba(255,255,255,0.92)] outline-none placeholder:text-[#8a969c] dark:bg-white/[0.06] dark:text-white dark:shadow-[inset_6px_6px_12px_rgba(0,0,0,0.28),inset_-6px_-6px_12px_rgba(255,255,255,0.035)] dark:placeholder:text-white/35"
              />
            </div>

            <Link
              href="/dashboard/category/create"
              className="flex items-center justify-center gap-2 rounded-2xl bg-[#edf2f4] px-5 py-3 text-sm font-black text-[#20272c] shadow-[8px_8px_18px_rgba(130,145,152,0.2),-8px_-8px_18px_rgba(255,255,255,0.95)] transition-all hover:-translate-y-0.5 active:translate-y-0 active:shadow-[inset_5px_5px_10px_rgba(130,145,152,0.22),inset_-5px_-5px_10px_rgba(255,255,255,0.92)] dark:bg-white/[0.07] dark:text-white dark:shadow-[8px_8px_18px_rgba(0,0,0,0.28),-5px_-5px_14px_rgba(255,255,255,0.035)] dark:active:shadow-[inset_5px_5px_10px_rgba(0,0,0,0.28),inset_-5px_-5px_10px_rgba(255,255,255,0.035)]"
            >
              <Plus className="h-5 w-5" />
              Tambah Kategori
            </Link>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[2.2rem] bg-[#edf2f4] p-3 shadow-[18px_18px_42px_rgba(130,145,152,0.20),-14px_-14px_34px_rgba(255,255,255,0.92)] dark:bg-white/[0.055] dark:shadow-[18px_18px_42px_rgba(0,0,0,0.32),-8px_-8px_24px_rgba(255,255,255,0.035)]">
        <div className="overflow-x-auto rounded-[1.7rem] bg-[#edf2f4] shadow-[inset_7px_7px_14px_rgba(130,145,152,0.16),inset_-7px_-7px_14px_rgba(255,255,255,0.88)] dark:bg-white/[0.035] dark:shadow-[inset_7px_7px_14px_rgba(0,0,0,0.24),inset_-7px_-7px_14px_rgba(255,255,255,0.03)]">
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead>
              <tr className="text-xs font-black uppercase tracking-[0.18em] text-[#7a858b] dark:text-white/40">
                <th className="px-5 py-5">
                  <span className="inline-flex items-center gap-2">
                    <Hash className="h-4 w-4" />
                    ID
                  </span>
                </th>
                <th className="px-5 py-5">
                  <span className="inline-flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Nama
                  </span>
                </th>
                <th className="px-5 py-5">Slug</th>
                <th className="px-5 py-5">Status</th>
                <th className="px-5 py-5">
                  <span className="inline-flex items-center gap-2">
                    <ListOrdered className="h-4 w-4" />
                    Urutan
                  </span>
                </th>
                <th className="px-5 py-5 text-center">Aksi</th>
              </tr>
            </thead>

            <tbody className="text-sm font-bold">
              {filteredCategories.map((category) => (
                <tr
                  key={category.id}
                  className="border-t border-white/50 transition-colors hover:bg-white/30 dark:border-white/5 dark:hover:bg-white/[0.035]"
                >
                  <td className="px-5 py-4 text-[#8a969c] dark:text-white/40">
                    #{category.id}
                  </td>

                  <td className="px-5 py-4 text-[#20272c] dark:text-[#f7efe7]">
                    {category.name}
                  </td>

                  <td className="px-5 py-4 text-[#6f7a80] dark:text-white/50">
                    {category.slug}
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-black ${
                        category.isActive
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
                          : "bg-red-500/10 text-red-500 dark:text-red-300"
                      }`}
                    >
                      {category.isActive ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5" />
                      )}
                      {category.isActive ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-[#20272c] dark:text-[#f7efe7]">
                    {category.sortOrder ?? 0}
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <Link
                        href={`/dashboard/category/${category.id}/edit`}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#edf2f4] px-3 py-2 text-xs font-black text-[#20272c] shadow-[5px_5px_11px_rgba(130,145,152,0.18),-5px_-5px_11px_rgba(255,255,255,0.9)] transition-all active:shadow-[inset_4px_4px_8px_rgba(130,145,152,0.22),inset_-4px_-4px_8px_rgba(255,255,255,0.9)] dark:bg-white/[0.07] dark:text-white dark:shadow-[5px_5px_11px_rgba(0,0,0,0.24),-3px_-3px_9px_rgba(255,255,255,0.03)]"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        Edit
                      </Link>

                      <button
                        onClick={() =>
                          openDeleteModal(category.id, category.name)
                        }
                        className="inline-flex items-center gap-2 rounded-xl bg-[#edf2f4] px-3 py-2 text-xs font-black text-red-500 shadow-[5px_5px_11px_rgba(130,145,152,0.18),-5px_-5px_11px_rgba(255,255,255,0.9)] transition-all active:shadow-[inset_4px_4px_8px_rgba(130,145,152,0.22),inset_-4px_-4px_8px_rgba(255,255,255,0.9)] dark:bg-white/[0.07] dark:text-red-300 dark:shadow-[5px_5px_11px_rgba(0,0,0,0.24),-3px_-3px_9px_rgba(255,255,255,0.03)]"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
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
                    className="px-5 py-12 text-center text-sm font-bold text-[#8a969c] dark:text-white/40"
                  >
                    Kategori tidak ditemukan.
                  </td>
                </tr>
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
              Hapus Kategori?
            </h3>

            <p className="mt-2 text-center text-sm font-semibold text-[#6f7a80] dark:text-white/55">
              Yakin ingin menghapus{" "}
              <span className="font-black text-[#20272c] dark:text-white">
                {categoryToDelete?.name}
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
    </div>
  );
}