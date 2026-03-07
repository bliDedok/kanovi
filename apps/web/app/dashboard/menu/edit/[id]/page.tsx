"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

export default function EditMenuPage() {
  const params = useParams();
  
  // PERBAIKAN: Beri pengaman as string agar TypeScript paham
  const id = params?.id as string; 
  
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const getToken = () => document.cookie.split('; ').find(row => row.startsWith('kanovi_token='))?.split('=')[1];

  useEffect(() => {
    const fetchMenu = async () => {
      // PERBAIKAN: Cegah request kalau id-nya masih undefined
      if (!id) return; 

      const res = await fetch(`http://localhost:3001/api/menus/${id}`, {
        headers: { "Authorization": `Bearer ${getToken()}` }
      });
      if (res.ok) {
        const data = await res.json();
        setName(data.name);
        setPrice(data.price.toString());
      }
    };
    fetchMenu();
  }, [id]);

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return toast.error("Error: ID Menu tidak terbaca.");

    setIsLoading(true);
    const toastId = toast.loading("Menyimpan perubahan...");
    
    try {
      const res = await fetch(`http://localhost:3001/api/menus/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${getToken()}` },
        body: JSON.stringify({ name, price: Number(price) })
      });
      
      setIsLoading(false);
      
      if (res.ok) {
        toast.success("Perubahan berhasil disimpan!", { id: toastId });
        router.push("/dashboard/menu"); 
      } else {
        const errorData = await res.json();
        toast.error(`Gagal: ${errorData.message}`, { id: toastId });
      }
    } catch (error) {
      setIsLoading(false);
      toast.error("Terjadi kesalahan server.", { id: toastId });
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
        {/* PERBAIKAN: Tampilkan ID kalau ada, atau "Loading..." kalau kosong */}
        <h1 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-gray-900 dark:text-white">
          Edit Menu #{id || "..."}
        </h1>
        
        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
          <div>
            <label className="block text-sm md:text-base font-semibold mb-1.5 md:mb-2 text-gray-700 dark:text-gray-300">Nama Kopi / Menu</label>
            <input 
              type="text" required value={name} onChange={(e) => setName(e.target.value)}
              className="w-full p-3 md:p-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 dark:text-white transition-shadow text-sm md:text-base"
            />
          </div>

          <div>
            <label className="block text-sm md:text-base font-semibold mb-1.5 md:mb-2 text-gray-700 dark:text-gray-300">Harga (Rp)</label>
            <input 
              type="number" required value={price} onChange={(e) => setPrice(e.target.value)}
              className="w-full p-3 md:p-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 dark:text-white transition-shadow text-sm md:text-base"
            />
          </div>

          <button 
            type="submit" disabled={isLoading}
            className={`w-full p-3 md:p-4 font-bold rounded-xl transition-all shadow-md mt-2 md:mt-4 text-sm md:text-base ${isLoading ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed text-gray-100' : 'bg-green-600 hover:bg-green-700 text-white hover:shadow-lg hover:-translate-y-0.5'}`}
          >
            {isLoading ? "Menyimpan Perubahan..." : "Update Menu"}
          </button>
        </form>
      </div>
    </div>
  );
}