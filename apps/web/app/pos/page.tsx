"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function POSPage() {
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Ambil keranjang dari localStorage jika ada (saat tombol back dari checkout ditekan)
  const [cart, setCart] = useState<any[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("kanovi_cart");
      if (saved) return JSON.parse(saved);
    }
    return [];
  });
  
  const [menus, setMenus] = useState<any[]>([]);

  const getToken = () => document.cookie.split('; ').find(row => row.startsWith('kanovi_token='))?.split('=')[1];

  const fetchMenus = async () => {
    try {
      const token = getToken();
      const res = await fetch("http://localhost:3001/api/menus", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) setMenus(await res.json()); 
    } catch (error) {
      console.error("Gagal mengambil data menu", error);
    }
  };

  useEffect(() => {
    fetchMenus();
    const savedTheme = localStorage.getItem("kanovi_theme");
    if (savedTheme === "dark" || document.documentElement.classList.contains("dark")) {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    }
    // Simpan keranjang setiap kali berubah
    localStorage.setItem("kanovi_cart", JSON.stringify(cart));
  }, [cart]);

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("kanovi_theme", "light");
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("kanovi_theme", "dark");
      setIsDarkMode(true);
    }
  };

  const addToCart = (menu: any) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === menu.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === menu.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prevCart, { ...menu, qty: 1 }];
    });
  };

  const updateQty = (id: number, delta: number) => {
    setCart((prevCart) => {
      return prevCart.map((item) => {
        if (item.id === id) {
          const newQty = item.qty + delta;
          return { ...item, qty: newQty > 0 ? newQty : 0 };
        }
        return item;
      }).filter(item => item.qty > 0); 
    });
  };

  const totalTagihan = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const filteredMenus = menus.filter(menu => menu.name.toLowerCase().includes(searchQuery.toLowerCase()));

  // LOGIKA CASH
  const cashNum = parseInt(cashReceived.replace(/[^0-9]/g, "")) || 0;
  const kembalian = cashNum - totalTagihan;
  const isEnough = cashNum >= totalTagihan;

  const suggestedAmounts = [totalTagihan];
  const nextTenThousand = Math.ceil(totalTagihan / 10000) * 10000;
  if (nextTenThousand > totalTagihan) suggestedAmounts.push(nextTenThousand);
  if (totalTagihan < 50000) suggestedAmounts.push(50000);
  if (totalTagihan < 100000) suggestedAmounts.push(100000);
  const uniqueSuggestedAmounts = Array.from(new Set(suggestedAmounts)).sort((a, b) => a - b).slice(0, 4);

  const handleConfirmCash = async () => {
    if (!isEnough) return toast.error("Uang belum cukup!");
    const toastId = toast.loading("Memproses...");
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      toast.success("Berhasil!", { id: toastId });
      setFinalChange(kembalian);
      setCart([]);
      setIsCashModalOpen(false);
      setShowSuccessModal(true);
    } catch (error) {
      toast.error("Gagal memproses", { id: toastId });
    }
  };

  // === FUNGSI PINDAH KE HALAMAN CHECKOUT ===
  const handleGoToCheckout = () => {
    localStorage.setItem("kanovi_cart", JSON.stringify(cart)); // Pastikan tersimpan
    router.push("/pos/checkout"); // Pindah ke halaman baru
  };

  return (
    <div className="flex h-screen bg-kanovi-bone dark:bg-kanovi-dark transition-colors duration-300 font-sans overflow-hidden relative">
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-16 flex items-center justify-between px-3 md:px-4 lg:px-6 bg-kanovi-paper dark:bg-kanovi-darker border-b border-kanovi-cream/50 dark:border-white/5 shadow-sm z-10 shrink-0">
          <div className="flex flex-col min-w-max pr-2">
            <h1 className="text-base md:text-lg font-bold text-kanovi-coffee dark:text-kanovi-bone leading-tight">POS Kanovi</h1>
            <p className="text-[10px] md:text-xs text-kanovi-coffee/70 dark:text-kanovi-cream/70 -mt-0.5 hidden md:block">Sistem Kasir</p>
          </div>

          <div className="flex-1 max-w-sm md:max-w-md lg:max-w-xl mx-2 md:mx-4 relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-kanovi-wood dark:text-kanovi-cream/50">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </span>
            <input 
              type="text" 
              placeholder="Cari menu..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-kanovi-bone dark:bg-kanovi-dark border border-kanovi-cream/50 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-kanovi-wood text-kanovi-coffee dark:text-kanovi-bone"
            />
          </div>

          <div className="flex items-center gap-2 md:gap-3 min-w-max">
            <button onClick={toggleTheme} className="p-2 bg-kanovi-bone dark:bg-kanovi-dark rounded-full hover:bg-kanovi-cream/50 transition-colors text-kanovi-coffee dark:text-kanovi-cream border border-kanovi-cream/50 dark:border-white/10 text-sm">
              {isDarkMode ? "☀️" : "🌙"}
            </button>
            <button onClick={() => { document.cookie = "kanovi_token=; path=/; max-age=0;"; document.cookie = "kanovi_role=; path=/; max-age=0;"; router.push("/login"); }} className="flex items-center gap-1.5 md:gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-kanovi-danger/10 hover:bg-kanovi-danger/20 text-kanovi-danger dark:bg-kanovi-danger/20 dark:hover:bg-kanovi-danger/40 dark:text-red-400 text-xs md:text-sm font-semibold rounded-lg transition-colors border border-kanovi-danger/20">
              <span>🚪</span> <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-3 md:p-4 lg:p-6">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-3 sm:gap-4">
            {filteredMenus.map((menu) => (
              <button 
                key={menu.id}
                onClick={() => addToCart(menu)} 
                className="w-full max-w-32 aspect-square mx-auto bg-kanovi-dark text-white dark:bg-[#EADBC8] dark:text-kanovi-coffee rounded-xl p-3 flex flex-col justify-between items-start text-left shadow-sm active:scale-95 transition-all border border-black/5 dark:border-white/5"
              >
                <span className="font-bold text-xs leading-tight line-clamp-3">{menu.name}</span>
                <span className="font-medium text-[11px] opacity-90">Rp {menu.price.toLocaleString("id-ID")}</span>
              </button>
            ))}
          </div>
          {filteredMenus.length === 0 && (
             <div className="flex flex-col items-center justify-center h-full text-kanovi-coffee/50 dark:text-kanovi-cream/50 px-4 text-center">
             <span className="text-3xl mb-3">🕵️‍♂️</span>
             <p className="text-sm">Tidak ada menu yang ditemukan.</p>
           </div>
          )}
        </main>
      </div>

      {/* =========================================
          BAGIAN KANAN: KERANJANG PESANAN
          ========================================= */}
      <aside className="w-72 md:w-80 lg:w-96 shrink-0 bg-kanovi-paper dark:bg-kanovi-darker border-l border-kanovi-cream/50 dark:border-white/5 flex flex-col shadow-2xl z-20">
        
        <div className="h-16 flex items-center px-4 sm:px-5 pt-2 shrink-0">
          <h2 className="font-bold text-base md:text-lg text-kanovi-coffee dark:text-kanovi-bone flex items-center gap-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
            Keranjang
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto px-6 flex flex-col bg-kanovi-paper dark:bg-kanovi-darker">
          {cart.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center opacity-30 text-kanovi-coffee dark:text-kanovi-bone">
              <p className="text-sm font-medium">Belum ada pesanan</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1 w-full mt-2">
              {cart.map((item) => (
                <div key={item.id} className="flex flex-col py-3 border-b border-kanovi-cream/30 dark:border-white/5 last:border-0">
                  <h4 className="font-semibold text-kanovi-coffee dark:text-kanovi-bone text-xs md:text-sm leading-tight mb-1.5">{item.name}</h4>
                  <div className="flex justify-between items-center">
                    <div className="text-kanovi-wood dark:text-kanovi-cream/70 text-xs md:text-sm font-medium">
                      Rp {(item.price * item.qty).toLocaleString("id-ID")}
                    </div>
                    <div className="flex items-center gap-1 md:gap-2 bg-kanovi-bone dark:bg-kanovi-dark rounded-full p-1 border border-kanovi-cream/50 dark:border-white/5">
                      <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-kanovi-paper dark:bg-kanovi-darker flex items-center justify-center text-kanovi-coffee dark:text-kanovi-cream hover:bg-kanovi-wood hover:text-white transition-colors shadow-sm">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 md:w-3.5 md:h-3.5"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                      </button>
                      <span className="font-bold text-xs md:text-sm w-4 md:w-5 text-center text-kanovi-coffee dark:text-kanovi-bone">{item.qty}</span>
                      <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-kanovi-paper dark:bg-kanovi-darker flex items-center justify-center text-kanovi-coffee dark:text-kanovi-cream hover:bg-kanovi-wood hover:text-white transition-colors shadow-sm">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 md:w-3.5 md:h-3.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="px-6 pb-6 pt-2 mt-auto bg-kanovi-paper dark:bg-kanovi-darker border-t border-kanovi-cream/30 dark:border-white/5">
          <div className="flex justify-between items-end mb-4 pt-4">
            <span className="text-kanovi-coffee/80 dark:text-kanovi-cream/80 font-semibold text-sm">Total Tagihan</span>
            <span className="text-xl font-bold text-kanovi-coffee dark:text-kanovi-bone">Rp {totalTagihan.toLocaleString("id-ID")}</span>
          </div>
          <div className="flex flex-col gap-2.5">
            {/* INI YANG BERUBAH: SEKARANG PINDAH HALAMAN */}
            <button 
              onClick={handleGoToCheckout}
              disabled={cart.length === 0}
              className="w-full py-3 md:py-3.5 bg-kanovi-wood hover:bg-kanovi-coffee text-white font-bold text-xs md:text-sm rounded-xl shadow-md active:scale-[0.98] transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 md:w-5 md:h-5"><rect x="2" y="6" width="20" height="12" rx="2"></rect><circle cx="12" cy="12" r="2"></circle><path d="M6 12h.01M18 12h.01"></path></svg>
              BAYAR TUNAI
            </button>
            <button 
              disabled={cart.length === 0}
              className="w-full py-3 md:py-3.5 bg-kanovi-darker dark:bg-black/50 hover:bg-kanovi-coffee dark:hover:bg-kanovi-dark text-white font-bold text-xs md:text-sm rounded-xl shadow-md border border-kanovi-wood/30 active:scale-[0.98] transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 md:w-5 md:h-5"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>
              QRIS MANUAL
            </button>
          </div>
        </div>
      </aside>

      {/* MODAL CASH */}
      {isCashModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-kanovi-paper dark:bg-kanovi-darker rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-kanovi-cream/50 dark:border-white/5">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-kanovi-coffee dark:text-kanovi-bone">Pembayaran Tunai</h3>
              <button onClick={() => setIsCashModalOpen(false)} className="text-2xl text-kanovi-coffee dark:text-kanovi-bone opacity-50">&times;</button>
            </div>
            <div className="bg-kanovi-bone dark:bg-kanovi-dark p-4 rounded-xl mb-6 text-center border border-kanovi-cream/30 dark:border-white/5">
              <p className="text-xs text-kanovi-coffee/70 dark:text-kanovi-cream/70 font-bold uppercase mb-1">Total Tagihan</p>
              <p className="text-3xl font-bold text-kanovi-wood dark:text-kanovi-cream">Rp {totalTagihan.toLocaleString("id-ID")}</p>
            </div>
            <div className="mb-4 text-kanovi-coffee dark:text-kanovi-bone">
              <label className="block text-sm font-bold mb-2 opacity-80">Uang Diterima (Rp)</label>
              <input type="text" inputMode="numeric" value={cashReceived ? Number(cashReceived).toLocaleString("id-ID") : ""} onChange={(e) => setCashReceived(e.target.value.replace(/[^0-9]/g, ""))} placeholder="0" className="w-full px-4 py-3 bg-white dark:bg-black/20 border border-kanovi-cream dark:border-white/10 rounded-xl text-right text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-kanovi-wood text-kanovi-coffee dark:text-kanovi-bone" autoFocus />
            </div>
            <div className="grid grid-cols-2 gap-2 mb-6">
              {uniqueSuggestedAmounts.map((amt, idx) => (
                <button key={idx} onClick={() => setCashReceived(amt.toString())} className="py-2.5 bg-kanovi-cream/30 hover:bg-kanovi-cream/60 dark:bg-white/5 dark:hover:bg-white/10 text-kanovi-coffee dark:text-kanovi-bone rounded-lg text-sm font-bold border border-kanovi-cream/50 dark:border-white/10">
                  {amt === totalTagihan ? "Uang Pas" : `Rp ${amt.toLocaleString("id-ID")}`}
                </button>
              ))}
            </div>
            <div className={`p-4 rounded-xl mb-6 flex justify-between items-center border ${isEnough ? 'bg-green-100 dark:bg-green-900/20 border-green-200 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/20 border-red-200 text-red-600 dark:text-red-400'}`}>
              <span className="font-bold text-sm">{isEnough ? 'Kembalian' : 'Kurang'}</span>
              <span className="text-xl font-bold">Rp {Math.abs(kembalian).toLocaleString("id-ID")}</span>
            </div>
            <button onClick={handleConfirmCash} disabled={!isEnough || cashNum === 0} className="w-full py-4 bg-kanovi-wood hover:bg-kanovi-coffee text-white font-bold rounded-xl shadow-md disabled:opacity-50">Selesaikan Pembayaran</button>
          </div>
        </div>
      )}

      {/* MODAL SUKSES */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-kanovi-paper dark:bg-kanovi-darker rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center border border-kanovi-cream/50 dark:border-white/5">
            <div className="w-20 h-20 mx-auto bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mb-6">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-10 h-10"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <h2 className="text-2xl font-bold mb-2 text-kanovi-coffee dark:text-kanovi-bone">Pembayaran Berhasil!</h2>
            <div className="bg-kanovi-bone dark:bg-kanovi-dark rounded-xl p-4 mb-8 mt-4 border border-kanovi-cream/50 dark:border-white/5">
              <p className="text-xs text-kanovi-coffee/70 dark:text-kanovi-cream/70 font-bold uppercase mb-1">Kembalian</p>
              <p className="text-3xl font-bold text-kanovi-wood dark:text-kanovi-cream">Rp {finalChange.toLocaleString("id-ID")}</p>
            </div>
            <button onClick={() => setShowSuccessModal(false)} className="w-full py-4 bg-kanovi-wood hover:bg-kanovi-coffee text-white font-bold rounded-xl text-lg">Pesanan Baru</button>
          </div>
        </div>
      )}
    </div>
  );
}