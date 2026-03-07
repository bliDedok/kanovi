"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CreateMenuPage() {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const getToken = () => document.cookie.split('; ').find(row => row.startsWith('kanovi_token='))?.split('=')[1];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const res = await fetch("http://localhost:3001/api/menus", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${getToken()}` },
      body: JSON.stringify({ name, price: Number(price) })
    });
    setIsLoading(false);
    if (res.ok) router.push("/dashboard/menu"); 
    else alert("Gagal menambahkan menu.");
  };

  return (
    <div className="max-w-2xl mx-auto w-full">
      <Link 
        href="/dashboard/menu"
        className="inline-flex items-center gap-2 text-sm md:text-base text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors mb-4 md:mb-6 font-medium"
      >
        <span>←</span> Kembali
      </Link>

      <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
        <h1 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-gray-900 dark:text-white">Tambah Menu Baru</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
          <div>
            <label className="block text-sm md:text-base font-semibold mb-1.5 md:mb-2 text-gray-700 dark:text-gray-300">Nama Kopi / Menu</label>
            <input 
              type="text" required value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Kopi Susu Gula Aren"
              className="w-full p-3 md:p-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 transition-shadow text-sm md:text-base"
            />
          </div>

          <div>
            <label className="block text-sm md:text-base font-semibold mb-1.5 md:mb-2 text-gray-700 dark:text-gray-300">Harga (Rp)</label>
            <input 
              type="number" required value={price} onChange={(e) => setPrice(e.target.value)}
              placeholder="Contoh: 15000"
              className="w-full p-3 md:p-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 transition-shadow text-sm md:text-base"
            />
          </div>

          <button 
            type="submit" disabled={isLoading}
            className={`w-full p-3 md:p-4 font-bold rounded-xl transition-all shadow-md mt-2 md:mt-4 text-sm md:text-base ${isLoading ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed text-gray-100' : 'bg-green-600 hover:bg-green-700 text-white hover:shadow-lg hover:-translate-y-0.5'}`}
          >
            {isLoading ? "Menyimpan..." : "Simpan Menu"}
          </button>
        </form>
      </div>
    </div>
  );
}