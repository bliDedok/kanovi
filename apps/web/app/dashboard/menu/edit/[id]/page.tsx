"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

type Category = {
  id: number;
  name: string;
  slug: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3001";

export default function EditMenuPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const params = useParams();
  const id = params?.id as string;

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const getToken = () =>
    document.cookie
      .split("; ")
      .find((row) => row.startsWith("kanovi_token="))
      ?.split("=")[1];

  useEffect(() => {
    const fetchInitialData = async () => {
      if (!id) return;

      const token = getToken();

      if (!token) {
        toast.error("Token login tidak ditemukan. Silakan login ulang.");
        return;
      }

      try {
        const [categoryRes, menuRes] = await Promise.all([
          fetch(`${API_BASE}/categories`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
          }),
          fetch(`${API_BASE}/api/menus/${id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
          }),
        ]);

        const categoryData = await categoryRes.json().catch(() => null);
        const menuData = await menuRes.json().catch(() => null);

        if (!categoryRes.ok) {
          throw new Error(categoryData?.message || "Gagal mengambil kategori");
        }

        if (!menuRes.ok) {
          throw new Error(menuData?.message || "Gagal mengambil detail menu");
        }

        setCategories(Array.isArray(categoryData) ? categoryData : []);
        setName(menuData.name ?? "");
        setPrice(menuData.price ? String(menuData.price) : "");
        setCategoryId(menuData.categoryId ? String(menuData.categoryId) : "");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Gagal memuat data menu"
        );
      }
    };

    fetchInitialData();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!id) {
      toast.error("Error: ID Menu tidak terbaca.");
      return;
    }

    const trimmedName = name.trim();
    const numericPrice = Number(price);
    const token = getToken();

    if (!token) {
      toast.error("Token login tidak ditemukan. Silakan login ulang.");
      return;
    }

    if (!trimmedName) {
      toast.error("Nama menu wajib diisi.");
      return;
    }

    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      toast.error("Harga menu harus lebih dari 0.");
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading("Menyimpan perubahan...");

    try {
      const res = await fetch(`${API_BASE}/api/menus/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: trimmedName,
          price: numericPrice,
          categoryId: categoryId ? Number(categoryId) : null,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.message || "Gagal mengupdate menu.");
      }

      toast.success("Perubahan berhasil disimpan!", { id: toastId });
      router.push("/dashboard/menu");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Terjadi kesalahan server.",
        { id: toastId }
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto w-full animate-fade-in">
      <Link
        href="/dashboard/menu"
        className="inline-flex items-center gap-2 text-sm md:text-base text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors mb-4 md:mb-6 font-medium"
      >
        <span>←</span> Batal Edit
      </Link>

      <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
        <h1 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-gray-900 dark:text-white">
          Edit Menu #{id || "..."}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
          <div>
            <label className="block text-sm md:text-base font-semibold mb-1.5 md:mb-2 text-gray-700 dark:text-gray-300">
              Nama Kopi / Menu
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 md:p-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 dark:text-white transition-shadow text-sm md:text-base"
            />
          </div>

          <div>
            <label className="block text-sm md:text-base font-semibold mb-1.5 md:mb-2 text-gray-700 dark:text-gray-300">
              Harga (Rp)
            </label>
            <input
              type="number"
              required
              min="1"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full p-3 md:p-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 dark:text-white transition-shadow text-sm md:text-base"
            />
          </div>

          <div>
            <label className="block text-sm md:text-base font-semibold mb-1.5 md:mb-2 text-gray-700 dark:text-gray-300">
              Kategori
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full p-3 md:p-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 dark:text-white text-sm md:text-base"
            >
              <option value="">Tanpa kategori</option>
              {categories.map((cat) => (
                <option key={cat.id} value={String(cat.id)}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full p-3 md:p-4 font-bold rounded-xl transition-all shadow-md mt-2 md:mt-4 text-sm md:text-base ${
              isLoading
                ? "bg-gray-400 dark:bg-gray-600 cursor-not-allowed text-gray-100"
                : "bg-green-600 hover:bg-green-700 text-white hover:shadow-lg hover:-translate-y-0.5"
            }`}
          >
            {isLoading ? "Menyimpan Perubahan..." : "Update Menu"}
          </button>
        </form>
      </div>
    </div>
  );
}