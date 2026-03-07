"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function MenuListPage() {
  const [menus, setMenus] = useState([]);

  const getToken = () => {
    return document.cookie.split('; ').find(row => row.startsWith('kanovi_token='))?.split('=')[1];
  };

  const fetchMenus = async () => {
    const token = getToken();
    const res = await fetch("http://localhost:3001/api/menus", {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (res.ok) setMenus(await res.json());
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Yakin ingin menghapus menu ini?")) return;
    const token = getToken();
    const res = await fetch(`http://localhost:3001/api/menus/${id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (res.ok) fetchMenus();
  };

  useEffect(() => { fetchMenus(); }, []);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Daftar Menu</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Kelola harga dan produk kopi yang dijual.</p>
        </div>
        <Link 
          href="/dashboard/menu/create"
          className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2"
        >
          <span>+</span> Tambah Menu
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-300 text-sm uppercase tracking-wider">
                <th className="p-4 border-b border-gray-200 dark:border-gray-700 font-semibold">ID</th>
                <th className="p-4 border-b border-gray-200 dark:border-gray-700 font-semibold">Nama Menu</th>
                <th className="p-4 border-b border-gray-200 dark:border-gray-700 font-semibold">Harga</th>
                <th className="p-4 border-b border-gray-200 dark:border-gray-700 font-semibold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {menus.map((menu: any) => (
                <tr key={menu.id} className="hover:bg-gray-50 dark:hover:bg-gray-750/50 transition-colors">
                  <td className="p-4 text-gray-500 dark:text-gray-400">#{menu.id}</td>
                  <td className="p-4 font-medium text-gray-900 dark:text-white">{menu.name}</td>
                  <td className="p-4 text-gray-700 dark:text-gray-300">Rp {menu.price.toLocaleString("id-ID")}</td>
                  <td className="p-4 text-center">
                    <button 
                      onClick={() => handleDelete(menu.id)}
                      className="px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/30 dark:hover:bg-red-900/60 dark:text-red-400 text-sm font-medium rounded-md transition-colors"
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
              {menus.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500 dark:text-gray-400 italic">Belum ada menu, silakan tambah menu baru.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}