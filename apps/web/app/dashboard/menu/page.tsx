"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function MenuListPage() {
  const [menus, setMenus] = useState([]);

  const getToken = () => document.cookie.split('; ').find(row => row.startsWith('kanovi_token='))?.split('=')[1];

  const fetchMenus = async () => {
    const token = getToken();
    const res = await fetch("http://localhost:3001/api/menus", { headers: { "Authorization": `Bearer ${token}` } });
    if (res.ok) setMenus(await res.json());
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Yakin ingin menghapus menu ini?")) return;
    const res = await fetch(`http://localhost:3001/api/menus/${id}`, { method: "DELETE", headers: { "Authorization": `Bearer ${getToken()}` } });
    if (res.ok) fetchMenus();
  };

  useEffect(() => { fetchMenus(); }, []);

  return (
    <div className="max-w-5xl mx-auto w-full">
      {/* Header Responsif: Atas Bawah di HP, Kiri Kanan di iPad */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 md:mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Daftar Menu</h1>
          <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 mt-1">Kelola harga dan produk kopi yang dijual.</p>
        </div>
        <Link 
          href="/dashboard/menu/create"
          className="w-full sm:w-auto px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all flex justify-center items-center gap-2"
        >
          <span>+</span> Tambah Menu
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Table Wrapper untuk Horizontal Scroll di HP */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-125"> 
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-300 text-xs md:text-sm uppercase tracking-wider">
                <th className="p-3 md:p-4 border-b border-gray-200 dark:border-gray-700 font-semibold whitespace-nowrap">ID</th>
                <th className="p-3 md:p-4 border-b border-gray-200 dark:border-gray-700 font-semibold whitespace-nowrap">Nama Menu</th>
                <th className="p-3 md:p-4 border-b border-gray-200 dark:border-gray-700 font-semibold whitespace-nowrap">Harga</th>
                <th className="p-3 md:p-4 border-b border-gray-200 dark:border-gray-700 font-semibold text-center whitespace-nowrap">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-sm md:text-base">
              {menus.map((menu: any) => (
                <tr key={menu.id} className="hover:bg-gray-50 dark:hover:bg-gray-750/50 transition-colors">
                  <td className="p-3 md:p-4 text-gray-500 dark:text-gray-400">#{menu.id}</td>
                  <td className="p-3 md:p-4 font-medium text-gray-900 dark:text-white">{menu.name}</td>
                  <td className="p-3 md:p-4 text-gray-700 dark:text-gray-300">Rp {menu.price.toLocaleString("id-ID")}</td>
                  <td className="p-3 md:p-4 text-center">
                    <button onClick={() => handleDelete(menu.id)} className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/30 dark:hover:bg-red-900/60 dark:text-red-400 text-xs md:text-sm font-medium rounded-md transition-colors">
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
              {menus.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-6 md:p-8 text-center text-gray-500 dark:text-gray-400 italic text-sm md:text-base">Belum ada menu, silakan tambah menu baru.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}