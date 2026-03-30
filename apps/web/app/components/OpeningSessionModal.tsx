"use client";

import { useState, useEffect } from "react";
import { Coffee, Lock, User } from "lucide-react";
import { api } from "../../lib/api";

// Helper format ribuan Indonesia
const formatRibuan = (value: string) => {
  const angka = value.replace(/\D/g, "");
  if (!angka) return "";
  return parseInt(angka).toLocaleString("id-ID");
};

export default function OpeningSessionModal({ onOpenSuccess }: { onOpenSuccess: (session: any) => void }) {
  // Ambil cabang terakhir yang disimpan di tablet ini, default PUSAT
  const [branch, setBranch] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("kanovi_branch") || "PUSAT";
    }
    return "PUSAT";
  });

  const [openedBy, setOpenedBy] = useState("");
  const [initialCash, setInitialCash] = useState("");
  const [loading, setLoading] = useState(false);
  const [isFetchingUser, setIsFetchingUser] = useState(true);

  // Otomatis deteksi siapa yang sedang login
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = await api.getProfile();
        setOpenedBy(user.name);
      } catch (err) {
        console.error("Gagal mengambil profil user");
        setOpenedBy("Kasir Bertugas"); // Fallback jika gagal
      } finally {
        setIsFetchingUser(false);
      }
    };
    fetchUserData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!openedBy || !initialCash) return alert("Mohon tunggu profil dimuat dan isi modal awal!");
    
    setLoading(true);
    try {
      const res = await api.openSession({
        branch,
        openedBy,
        initialCash: Number(initialCash)
      });
      
      // Simpan pilihan cabang ke memori tablet agar besok otomatis terpilih lagi
      localStorage.setItem("kanovi_branch", branch);
      
      onOpenSuccess(res);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
      <div className="w-full max-w-md bg-kanovi-paper dark:bg-kanovi-darker rounded-3xl shadow-2xl border border-kanovi-cream/50 dark:border-white/10 overflow-hidden">
        {/* HEADER */}
        <div className="bg-kanovi-wood p-6 text-center text-white">
          <div className="mx-auto w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mb-3">
            <Coffee className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black">Sesi Kasir Baru</h2>
          <p className="text-xs opacity-80">Siapkan laci kasir untuk mulai pelayanan</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* PILIH CABANG (Diingat oleh LocalStorage) */}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Lokasi Penjualan</label>
            <div className="grid grid-cols-2 gap-2">
              {["PUSAT", "RESTART"].map((b) => (
                <button
                  key={b} type="button" onClick={() => setBranch(b)}
                  className={`py-3 rounded-xl font-bold text-xs transition-all border-2 ${branch === b ? 'border-kanovi-wood bg-kanovi-wood/10 text-kanovi-wood' : 'border-gray-100 dark:border-white/5 text-gray-400'}`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          {/* NAMA KASIR (Otomatis dari Login) */}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Kasir Bertugas</label>
            <div className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-black/20 flex items-center gap-3">
              <User className="w-4 h-4 text-kanovi-wood" />
              <span className="text-sm font-bold text-kanovi-coffee dark:text-white">
                {isFetchingUser ? "Mendeteksi akun..." : openedBy}
              </span>
            </div>
            <p className="text-[9px] text-gray-400 mt-1.5">* Nama otomatis diambil dari akun yang sedang login.</p>
          </div>

          {/* MODAL AWAL (Format Rp & Ribuan) */}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Modal Kas Awal (Cash)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-kanovi-coffee dark:text-white/40">Rp</span>
              <input 
                type="text" 
                value={formatRibuan(initialCash)} 
                onChange={(e) => setInitialCash(e.target.value.replace(/\D/g, ""))} 
                placeholder="0" 
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-kanovi-dark text-lg font-bold outline-none focus:ring-2 focus:ring-kanovi-wood dark:text-white" 
              />
            </div>
          </div>

          {/* BUTTON SUBMIT */}
          <button 
            type="submit" disabled={loading || isFetchingUser}
            className="w-full py-4 bg-kanovi-wood hover:bg-kanovi-coffee text-white font-bold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? "Menghubungkan Sesi..." : <><Lock className="w-4 h-4" /> BUKA KASIR SEKARANG</>}
          </button>
        </form>
      </div>
    </div>
  );
}