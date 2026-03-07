"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";

export default function MenuListPage() {
  const [menus, setMenus] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [menuToDelete, setMenuToDelete] = useState<{id: number, name: string} | null>(null);

  const getToken = () => document.cookie.split('; ').find(row => row.startsWith('kanovi_token='))?.split('=')[1];

  const fetchMenus = async () => {
    const token = getToken();
    const res = await fetch("http://localhost:3001/api/menus", { headers: { "Authorization": `Bearer ${token}` } });
    if (res.ok) setMenus(await res.json());
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
      const res = await fetch(`http://localhost:3001/api/menus/${menuToDelete.id}`, { 
        method: "DELETE", headers: { "Authorization": `Bearer ${getToken()}` } 
      });
      if (res.ok) {
        toast.success(`Menu ${menuToDelete.name} dihapus!`, { id: toastId });
        fetchMenus();
      } else toast.error("Gagal menghapus.", { id: toastId });
    } catch {
      toast.error("Error server.", { id: toastId });
    } finally {
      setMenuToDelete(null); 
    }
  };

  useEffect(() => { fetchMenus(); }, []);

  const filteredMenus = menus.filter((menu: any) =>
    menu.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto w-full relative">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 md:mb-8 gap-4">
        <div className="w-full lg:w-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-kanovi-coffee dark:text-kanovi-bone">Daftar Menu</h1>
          <p className="text-sm md:text-base text-kanovi-coffee/70 dark:text-kanovi-cream/70 mt-1">Kelola harga dan produk kopi yang dijual.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row w-full lg:w-auto gap-3">
          {/* SEARCH BAR */}
          <div className="relative w-full sm:w-64">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-kanovi-wood dark:text-kanovi-cream/50">🔍</span>
            <input 
              type="text" 
              placeholder="Cari kopi..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-kanovi-paper dark:bg-kanovi-darker border border-kanovi-cream dark:border-kanovi-darker/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-kanovi-wood text-kanovi-coffee dark:text-kanovi-bone placeholder-kanovi-coffee/40 dark:placeholder-kanovi-cream/30 transition-shadow text-sm"
            />
          </div>

          {/* TOMBOL TAMBAH MENU (Warna Kayu / Karamel) */}
          <Link 
            href="/dashboard/menu/create"
            className="w-full sm:w-auto px-5 py-2.5 bg-kanovi-wood hover:bg-kanovi-coffee text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all flex justify-center items-center gap-2"
          >
            <span>+</span> Tambah Menu
          </Link>
        </div>
      </div>

      {/* BACKGROUND TABEL (Kertas / Putih Tulang) */}
      <div className="bg-kanovi-paper dark:bg-kanovi-darker rounded-xl shadow-sm border border-kanovi-cream/50 dark:border-white/5 overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-125"> 
            <thead>
              {/* HEADER TABEL YANG LEBIH MENTRENG & TEGAS */}
              <tr className="bg-kanovi-cream dark:bg-[#32251E] border-b-2 border-kanovi-wood/30 dark:border-white/10 text-kanovi-coffee dark:text-kanovi-cream text-xs md:text-sm uppercase tracking-wider shadow-sm">
                <th className="p-3 md:p-4 font-bold">ID</th>
                <th className="p-3 md:p-4 font-bold">Nama Menu</th>
                <th className="p-3 md:p-4 font-bold">Harga</th>
                <th className="p-3 md:p-4 font-bold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-kanovi-cream/40 dark:divide-white/5 text-sm md:text-base">
              {filteredMenus.map((menu: any) => (
                // HOVER TABEL AMAN DARI FLASHBANG
                <tr key={menu.id} className="hover:bg-kanovi-cream/20 dark:hover:bg-white/5 transition-colors">
                  <td className="p-3 md:p-4 text-kanovi-coffee/60 dark:text-kanovi-cream/50">#{menu.id}</td>
                  <td className="p-3 md:p-4 font-semibold text-kanovi-coffee dark:text-kanovi-bone">{menu.name}</td>
                  <td className="p-3 md:p-4 text-kanovi-wood dark:text-kanovi-cream">Rp {menu.price.toLocaleString("id-ID")}</td>
                  
                  <td className="p-3 md:p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {/* TOMBOL EDIT (Warna Cream ke Kayu) */}
                      <Link 
                        href={`/dashboard/menu/edit/${menu.id}`}
                        className="px-3 py-1.5 bg-kanovi-cream/50 hover:bg-kanovi-wood text-kanovi-coffee hover:text-white dark:bg-kanovi-wood/20 dark:hover:bg-kanovi-wood/50 dark:text-kanovi-cream text-xs md:text-sm font-medium rounded-md transition-colors"
                      >
                        Edit
                      </Link>
                      
                      {/* TOMBOL HAPUS (Warna Merah Bata / Red Velvet) */}
                      <button 
                        onClick={() => openDeleteModal(menu.id, menu.name)} 
                        className="px-3 py-1.5 bg-kanovi-danger/10 hover:bg-kanovi-danger/20 text-kanovi-danger dark:bg-kanovi-danger/20 dark:hover:bg-kanovi-danger/40 dark:text-red-300 text-xs md:text-sm font-medium rounded-md transition-colors"
                      >
                        Hapus
                      </button>
                    </div>
                  </td> 
                </tr>
              ))}
              {filteredMenus.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-6 md:p-8 text-center text-kanovi-coffee/50 dark:text-kanovi-cream/40 italic text-sm md:text-base">
                    Menu tidak ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL HAPUS */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-kanovi-paper dark:bg-kanovi-darker rounded-2xl shadow-xl w-full max-w-sm p-6 transform scale-100 transition-all border border-kanovi-cream/50 dark:border-white/5">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-kanovi-danger/10 dark:bg-kanovi-danger/20 rounded-full mb-4">
              <span className="text-kanovi-danger dark:text-red-400 text-2xl">🗑️</span>
            </div>
            <h3 className="text-xl font-bold text-center text-kanovi-coffee dark:text-kanovi-bone mb-2">Hapus Menu?</h3>
            <p className="text-center text-kanovi-coffee/70 dark:text-kanovi-cream/70 mb-6 text-sm">
              Yakin ingin menghapus <span className="font-bold text-kanovi-coffee dark:text-white">{menuToDelete?.name}</span>?
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