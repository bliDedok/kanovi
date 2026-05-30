"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { ArrowLeft, ChefHat, Save, Tag, Wallet } from "lucide-react";

type Category = {
  id: number;
  name: string;
  slug: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3001";

export default function CreateMenuPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState("");
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
    const fetchCategories = async () => {
      try {
        const token = getToken();

        if (!token) {
          toast.error("Token login tidak ditemukan. Silakan login ulang.");
          return;
        }

        const res = await fetch(`${API_BASE}/categories`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        });

        const data = await res.json().catch(() => null);

        if (!res.ok) {
          throw new Error(data?.message || "Gagal mengambil kategori");
        }

        setCategories(Array.isArray(data) ? data : []);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Gagal mengambil kategori"
        );
      }
    };

    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
    const toastId = toast.loading("Menyimpan menu baru...");

    try {
      const res = await fetch(`${API_BASE}/api/menus`, {
        method: "POST",
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
        throw new Error(data?.message || "Gagal menambahkan menu.");
      }

      toast.success("Menu berhasil ditambahkan!", { id: toastId });
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

  const fieldClass =
    "w-full rounded-2xl bg-[#edf2f4] px-4 py-3 text-sm font-bold text-[#20272c] shadow-[inset_6px_6px_12px_rgba(130,145,152,0.20),inset_-6px_-6px_12px_rgba(255,255,255,0.92)] outline-none placeholder:text-[#8a969c] dark:bg-white/[0.06] dark:text-white dark:shadow-[inset_6px_6px_12px_rgba(0,0,0,0.28),inset_-6px_-6px_12px_rgba(255,255,255,0.035)] dark:placeholder:text-white/35";

  return (
    <div className="mx-auto w-full max-w-3xl animate-fade-in space-y-6">
      <Link
        href="/dashboard/menu"
        className="inline-flex items-center gap-2 rounded-2xl bg-[#edf2f4] px-4 py-3 text-sm font-black text-[#20272c] shadow-[7px_7px_16px_rgba(130,145,152,0.18),-7px_-7px_16px_rgba(255,255,255,0.92)] transition-all hover:-translate-y-0.5 active:translate-y-0 active:shadow-[inset_5px_5px_10px_rgba(130,145,152,0.22),inset_-5px_-5px_10px_rgba(255,255,255,0.92)] dark:bg-white/[0.07] dark:text-white dark:shadow-[7px_7px_16px_rgba(0,0,0,0.26),-5px_-5px_14px_rgba(255,255,255,0.035)] dark:active:shadow-[inset_5px_5px_10px_rgba(0,0,0,0.28),inset_-5px_-5px_10px_rgba(255,255,255,0.035)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali
      </Link>

      <section className="rounded-[2.2rem] border border-white/70 bg-[#edf2f4] p-6 shadow-[18px_18px_42px_rgba(130,145,152,0.20),-14px_-14px_34px_rgba(255,255,255,0.92)] dark:border-white/10 dark:bg-white/[0.055] dark:shadow-[18px_18px_42px_rgba(0,0,0,0.32),-8px_-8px_24px_rgba(255,255,255,0.035)] md:p-8">
        <div className="mb-7">
          <h1 className="text-3xl font-black tracking-tight text-[#20272c] dark:text-[#f7efe7] md:text-4xl">
            Tambah Menu Baru
          </h1>

          <p className="mt-3 text-sm font-semibold leading-relaxed text-[#6f7a80] dark:text-white/55 md:text-base">
            Tambahkan menu baru ke daftar produk Kanovi.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-black text-[#20272c] dark:text-[#f7efe7]">
              <ChefHat className="h-4 w-4" />
              Nama Kopi / Menu
            </label>

            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Kopi Susu Gula Aren"
              className={fieldClass}
            />
          </div>

          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-black text-[#20272c] dark:text-[#f7efe7]">
              <Wallet className="h-4 w-4" />
              Harga (Rp)
            </label>

            <input
              type="number"
              required
              min="1"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Contoh: 15000"
              className={fieldClass}
            />
          </div>

          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-black text-[#20272c] dark:text-[#f7efe7]">
              <Tag className="h-4 w-4" />
              Kategori
            </label>

            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className={`${fieldClass} text-[#20272c] dark:text-white`}
            >
              <option className="bg-[#edf2f4] text-[#20272c]" value="">
                Pilih kategori
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

          <button
            type="submit"
            disabled={isLoading}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#20272c] px-5 py-4 text-sm font-black text-white shadow-[8px_8px_18px_rgba(130,145,152,0.2)] transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-[#311B14]"
          >
            <Save className="h-5 w-5" />
            {isLoading ? "Menyimpan..." : "Simpan Menu"}
          </button>
        </form>
      </section>
    </div>
  );
}