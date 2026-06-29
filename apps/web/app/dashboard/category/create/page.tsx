"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { ArrowLeft, Check, Hash, Save, Tag } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3001";

export default function CreateCategoryPage() {
  const [name, setName] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [isActive, setIsActive] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const getToken = () =>
    document.cookie
      .split("; ")
      .find((row) => row.startsWith("kanovi_token="))
      ?.split("=")[1];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const token = getToken();
    const trimmedName = name.trim();

    if (!token) {
      toast.error("Token login tidak ditemukan. Silakan login ulang.");
      return;
    }

    if (!trimmedName) {
      toast.error("Nama kategori wajib diisi.");
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading("Menyimpan kategori baru...");

    try {
      const res = await fetch(`${API_BASE}/categories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: trimmedName,
          sortOrder: Number(sortOrder) || 0,
          isActive,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.message || "Gagal menambahkan kategori.");
      }

      toast.success("Kategori berhasil ditambahkan!", { id: toastId });
      router.push("/dashboard/category");
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
        href="/dashboard/category"
        className="inline-flex items-center gap-2 rounded-2xl bg-[#edf2f4] px-4 py-3 text-sm font-black text-[#20272c] shadow-[7px_7px_16px_rgba(130,145,152,0.18),-7px_-7px_16px_rgba(255,255,255,0.92)] transition-all hover:-translate-y-0.5 active:translate-y-0 active:shadow-[inset_5px_5px_10px_rgba(130,145,152,0.22),inset_-5px_-5px_10px_rgba(255,255,255,0.92)] dark:bg-white/[0.07] dark:text-white dark:shadow-[7px_7px_16px_rgba(0,0,0,0.26),-5px_-5px_14px_rgba(255,255,255,0.035)] dark:active:shadow-[inset_5px_5px_10px_rgba(0,0,0,0.28),inset_-5px_-5px_10px_rgba(255,255,255,0.035)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Kembali
      </Link>

      <section className="rounded-[2.2rem] border border-white/70 bg-[#edf2f4] p-6 shadow-[18px_18px_42px_rgba(130,145,152,0.20),-14px_-14px_34px_rgba(255,255,255,0.92)] dark:border-white/10 dark:bg-white/[0.055] dark:shadow-[18px_18px_42px_rgba(0,0,0,0.32),-8px_-8px_24px_rgba(255,255,255,0.035)] md:p-8">
        <div className="mb-7">
          <h1 className="text-3xl font-black tracking-tight text-[#20272c] dark:text-[#f7efe7] md:text-4xl">
            Tambah Kategori Baru
          </h1>

          <p className="mt-3 text-sm font-semibold leading-relaxed text-[#6f7a80] dark:text-white/55 md:text-base">
            Buat kategori baru untuk mengelompokkan menu Kanovi.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-black text-[#20272c] dark:text-[#f7efe7]">
              <Tag className="h-4 w-4" />
              Nama Kategori
            </label>

            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Makanan"
              className={fieldClass}
            />
          </div>

          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-black text-[#20272c] dark:text-[#f7efe7]">
              <Hash className="h-4 w-4" />
              Urutan Tampil
            </label>

            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              placeholder="0"
              className={fieldClass}
            />
          </div>

          <button
            type="button"
            onClick={() => setIsActive((value) => !value)}
            className={`flex w-full items-center justify-between rounded-2xl bg-[#edf2f4] px-4 py-3 text-sm font-black shadow-[7px_7px_16px_rgba(130,145,152,0.18),-7px_-7px_16px_rgba(255,255,255,0.92)] transition-all active:shadow-[inset_5px_5px_10px_rgba(130,145,152,0.22),inset_-5px_-5px_10px_rgba(255,255,255,0.92)] dark:bg-white/[0.07] dark:shadow-[7px_7px_16px_rgba(0,0,0,0.26),-5px_-5px_14px_rgba(255,255,255,0.035)] dark:active:shadow-[inset_5px_5px_10px_rgba(0,0,0,0.28),inset_-5px_-5px_10px_rgba(255,255,255,0.035)] ${
              isActive
                ? "text-[#20272c] dark:text-white"
                : "text-[#8a969c] dark:text-white/45"
            }`}
          >
            <span className="flex items-center gap-3">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-xl shadow-[inset_3px_3px_7px_rgba(130,145,152,0.20),inset_-3px_-3px_7px_rgba(255,255,255,0.88)] dark:shadow-[inset_3px_3px_7px_rgba(0,0,0,0.25),inset_-3px_-3px_7px_rgba(255,255,255,0.03)] ${
                  isActive
                    ? "bg-[#2b65d9] text-white dark:bg-[#FFD28A] dark:text-[#311B14]"
                    : "bg-[#edf2f4] text-transparent dark:bg-white/[0.06]"
                }`}
              >
                <Check className="h-4 w-4" />
              </span>
              Kategori aktif
            </span>

            <span className="text-xs font-black uppercase tracking-[0.16em] text-[#8a969c] dark:text-white/40">
              {isActive ? "Active" : "Inactive"}
            </span>
          </button>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#20272c] px-5 py-4 text-sm font-black text-white shadow-[8px_8px_18px_rgba(130,145,152,0.2)] transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-[#311B14]"
          >
            <Save className="h-5 w-5" />
            {isLoading ? "Menyimpan..." : "Simpan Kategori"}
          </button>
        </form>
      </section>
    </div>
  );
}