"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Trash2, Menu as MenuIcon, X, MonitorPlay, History, LogOut, Receipt, Calculator } from "lucide-react";
import { PaymentMethod, Menu, CartItem, ShortageItem } from "../../types";
import { api } from "../../lib/api";
import { ClearCartModal, CashModal, QrisModal, ShortageModal, SuccessModal } from "../components/PosModals";
import OpeningSessionModal from "../components/OpeningSessionModal";
import { ExpenseModal, ClosingModal } from "../components/FinanceModals";

export default function POSPage() {
  const router = useRouter();

  // --- SESSION STATES ---
  const [activeSession, setActiveSession] = useState<any>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  // --- EXISTING STATES ---
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [customerName, setCustomerName] = useState("");
  const [cashReceived, setCashReceived] = useState("");
  const [isCashModalOpen, setIsCashModalOpen] = useState(false);
  const [isQrisModalOpen, setIsQrisModalOpen] = useState(false);
  const [isClearCartModalOpen, setIsClearCartModalOpen] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isShortageModalOpen, setIsShortageModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [finalChange, setFinalChange] = useState(0);
  const [pendingPaymentMethod, setPendingPaymentMethod] = useState<PaymentMethod | null>(null);
  const [pendingOrderId, setPendingOrderId] = useState<number | null>(null);
  const [shortages, setShortages] = useState<ShortageItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  const [isClosingOpen, setIsClosingOpen] = useState(false);

  // --- LOGIC: CEK SESI (DIPERBAIKI) ---
  const checkSession = async (branchName: string) => {
    try {
      setIsCheckingSession(true);
      // Sekarang ngecek ke server sesuai cabang yang tersimpan di tablet masing-masing
      const session = await api.getActiveSession(branchName);
      setActiveSession(session);
    } catch (err) { 
      console.error("Gagal cek sesi", err); 
    } finally { 
      setIsCheckingSession(false); 
    }
  };

  useEffect(() => {
    // AMBIL CABANG DARI MEMORI TABLET (Samsung Diah = PUSAT, iPad Nata = RESTART)
    const savedBranch = localStorage.getItem("kanovi_branch") || "PUSAT";
    checkSession(savedBranch); 
    
    const loadMenus = async () => {
      try {
        const data = await api.getMenus();
        setMenus(Array.isArray(data) ? data : []);
      } catch (error) { console.error(error); }
    };
    loadMenus();

    const savedTheme = localStorage.getItem("kanovi_theme");
    if (savedTheme === "dark" || document.documentElement.classList.contains("dark")) {
      setIsDarkMode(true); document.documentElement.classList.add("dark");
    }
    const savedCart = localStorage.getItem("kanovi_cart");
    if (savedCart) { try { setCart(JSON.parse(savedCart)); } catch { localStorage.removeItem("kanovi_cart"); } }
  }, []);

  useEffect(() => { localStorage.setItem("kanovi_cart", JSON.stringify(cart)); }, [cart]);

  // --- LOGIC HANDLING ---
  const toggleTheme = () => {
    const isDark = !isDarkMode;
    setIsDarkMode(isDark);
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("kanovi_theme", isDark ? "dark" : "light");
  };

  const addToCart = (menu: Menu) => {
    setCart((prev) => {
      const exists = prev.find((i) => i.id === menu.id);
      if (exists) return prev.map((i) => i.id === menu.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...menu, qty: 1 }];
    });
  };

  const updateQty = (id: number, delta: number) => {
    setCart((prev) => prev.map((i) => i.id === id ? { ...i, qty: i.qty + delta } : i).filter((i) => i.qty > 0));
  };

  const handleProcessPayment = async (method: PaymentMethod, override = false) => {
    if (!activeSession) return alert("Sesi Kasir belum dibuka!");
    if (cart.length === 0 || isSubmitting) return;
    if (override && !overrideReason.trim()) return alert("Alasan override wajib diisi!");

    setIsSubmitting(true);
    try {
      let orderId: number;
      if (pendingOrderId !== null) { orderId = pendingOrderId; } 
      else {
        const draft = await api.createOrder({
          origin: "COUNTER", 
          customerName: customerName.trim() || undefined,
          branch: activeSession.branch, 
          sessionId: activeSession.id, 
          items: cart.map((item) => ({ menuId: item.id, qty: item.qty })),
        });
        orderId = Number(draft.id); setPendingOrderId(orderId);
      }

      if (!override) {
        const stockResult = await api.checkOrderStock(orderId);
        if (stockResult.hasShortage) {
          setPendingPaymentMethod(method); setShortages(stockResult.shortages || []);
          setIsCashModalOpen(false); setIsQrisModalOpen(false); setIsShortageModalOpen(true);
          return;
        }
      }

      await api.payOrder(orderId, {
        paymentMethod: method, overrideStock: override, overrideNote: override ? overrideReason : undefined,
      });

      const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
      const cashNumInput = parseInt(cashReceived.replace(/[^0-9]/g, "")) || 0;
      setFinalChange(method === "CASH" ? Math.max(cashNumInput - total, 0) : 0);
      setCart([]); setCustomerName(""); setCashReceived(""); setOverrideReason(""); 
      setIsCashModalOpen(false); setIsQrisModalOpen(false); setIsShortageModalOpen(false);
      setPendingOrderId(null); setShowSuccessModal(true);
    } catch (error: any) {
      alert(error.message);
    } finally { setIsSubmitting(false); }
  };

  // --- MEMOS ---
  const totalTagihan = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const filteredMenus = menus.filter((menu) => 
    menu.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
    (selectedCategory === "ALL" || String(menu.category?.id ?? "") === selectedCategory)
  );
  const categoryOptions = useMemo(() => {
    const map = new Map();
    menus.forEach((menu) => { if (menu.category?.id) map.set(menu.category.id, menu.category); });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [menus]);

  const cashNum = parseInt(cashReceived.replace(/[^0-9]/g, "")) || 0;
  const suggestedAmounts = [totalTagihan, Math.ceil(totalTagihan / 10000) * 10000, 50000, 100000].sort((a,b)=>a-b);
  const uniqueSuggestedAmounts = Array.from(new Set(suggestedAmounts)).slice(0, 4);

  return (
    <div className="flex h-screen bg-kanovi-bone dark:bg-kanovi-dark transition-colors duration-300 font-sans overflow-hidden relative">
      
      {!activeSession && !isCheckingSession && (
        <OpeningSessionModal onOpenSuccess={(session) => {
          setActiveSession(session);
          // Penting: Simpan cabang di memori tablet agar saat refresh tidak kembali ke modal
          localStorage.setItem("kanovi_branch", session.branch);
        }} />
      )}

      {isCheckingSession && (
        <div className="fixed inset-0 z-110 bg-kanovi-dark flex flex-col items-center justify-center text-white gap-4">
          <div className="w-10 h-10 border-4 border-kanovi-wood border-t-transparent rounded-full animate-spin"></div>
          <p className="font-bold text-sm tracking-widest uppercase">Memverifikasi Sesi...</p>
        </div>
      )}

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-16 flex items-center justify-between px-4 md:px-6 bg-kanovi-paper dark:bg-kanovi-darker border-b border-kanovi-cream/50 dark:border-white/5 shadow-sm z-10 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 rounded-xl text-kanovi-coffee dark:text-kanovi-bone hover:bg-kanovi-cream/50 dark:hover:bg-white/10 transition-colors focus:outline-none"><MenuIcon className="w-6 h-6" /></button>
            <div className="flex flex-col min-w-max">
              <h1 className="text-base md:text-lg font-bold text-kanovi-coffee dark:text-white leading-tight">POS Kanovi</h1>
              <p className="text-[10px] md:text-xs text-kanovi-coffee/70 dark:text-white/70 -mt-0.5 hidden md:block">
                {activeSession ? `Sesi ${activeSession.branch} - ${activeSession.openedBy}` : 'Sistem Kasir'}
              </p>
            </div>
          </div>
          <div className="flex-1 max-w-2xl mx-4 lg:mx-8 hidden sm:block">
            <div className="flex gap-2 w-full">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-kanovi-wood dark:text-kanovi-cream/50"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg></span>
                <input type="text" placeholder="Cari menu favorit..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-11 pr-4 py-2 bg-kanovi-bone dark:bg-kanovi-dark border border-kanovi-cream/50 rounded-full text-sm focus:outline-none text-kanovi-coffee dark:text-white" />
              </div>
              <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="px-4 py-2 bg-kanovi-bone dark:bg-kanovi-dark border border-kanovi-cream/50 rounded-full text-sm text-kanovi-coffee dark:text-white cursor-pointer min-w-35px">
                <option value="ALL">Semua Kategori</option>
                {categoryOptions.map((cat: any) => ( <option key={cat.id} value={String(cat.id)}>{cat.name}</option> ))}
              </select>
            </div>
          </div>
          <button onClick={toggleTheme} className="p-2 bg-kanovi-bone dark:bg-kanovi-dark rounded-full hover:bg-kanovi-cream/50 text-kanovi-coffee dark:text-kanovi-cream border border-kanovi-cream/50 dark:border-white/10 text-sm">{isDarkMode ? "☀️" : "🌙"}</button>
        </header>

        <main className="flex-1 overflow-y-auto p-3 md:p-4 lg:p-6">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-3 sm:gap-4">
            {filteredMenus.map((menu) => (
              <button key={menu.id} onClick={() => addToCart(menu)} className="w-full max-w-32 aspect-square mx-auto bg-kanovi-dark text-white dark:bg-[#EADBC8] dark:text-kanovi-coffee rounded-xl p-3 flex flex-col justify-between items-start text-left shadow-sm active:scale-95 transition-all border border-black/5 dark:border-white/5">
                <span className="font-bold text-xs leading-tight line-clamp-3">{menu.name}</span>
                <span className="font-medium text-[11px] opacity-90">Rp {menu.price.toLocaleString("id-ID")}</span>
              </button>
            ))}
          </div>
        </main>
      </div>

      <aside className="w-72 md:w-80 lg:w-96 shrink-0 bg-kanovi-paper dark:bg-kanovi-darker border-l border-kanovi-cream/50 dark:border-white/5 flex flex-col shadow-2xl z-20">
        <div className="h-16 flex items-center justify-between px-4 sm:px-5 pt-2 shrink-0">
          <h2 className="font-bold text-base md:text-lg text-kanovi-coffee dark:text-white flex items-center gap-2"><ShoppingCart className="w-5 h-5"/> Keranjang</h2>
          {cart.length > 0 && <button onClick={() => setIsClearCartModalOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /><span>Bersihkan</span></button>}
        </div>
        <div className="flex-1 overflow-y-auto px-6 flex flex-col">
          {cart.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center opacity-30 text-kanovi-coffee dark:text-white gap-4"><ShoppingCart className="w-16 h-16" /><p className="text-sm font-medium">Belum ada pesanan</p></div>
          ) : (
            <div className="flex flex-col gap-1 w-full mt-2">
              {cart.map((item) => (
                <div key={item.id} className="flex flex-col py-3 border-b border-kanovi-cream/30 dark:border-white/5 last:border-0">
                  <h4 className="font-semibold text-kanovi-coffee dark:text-white text-xs md:text-sm leading-tight mb-1.5">{item.name}</h4>
                  <div className="flex justify-between items-center">
                    <div className="text-kanovi-wood dark:text-kanovi-cream/70 text-xs md:text-sm font-medium">Rp {(item.price * item.qty).toLocaleString("id-ID")}</div>
                    <div className="flex items-center gap-1 md:gap-2 bg-kanovi-bone dark:bg-kanovi-dark rounded-full p-1 border border-kanovi-cream/50 dark:border-white/5">
                      <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-kanovi-paper dark:bg-kanovi-darker flex items-center justify-center text-kanovi-coffee dark:text-kanovi-cream hover:bg-kanovi-wood transition-colors shadow-sm"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 md:w-3.5 md:h-3.5"><line x1="5" y1="12" x2="19" y2="12"></line></svg></button>
                      <span className="font-bold text-xs md:text-sm w-4 md:w-5 text-center text-kanovi-coffee dark:text-white">{item.qty}</span>
                      <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-kanovi-paper dark:bg-kanovi-darker flex items-center justify-center text-kanovi-coffee dark:text-kanovi-cream hover:bg-kanovi-wood transition-colors shadow-sm"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 md:w-3.5 md:h-3.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="px-6 pb-6 pt-2 mt-auto bg-kanovi-paper dark:bg-kanovi-darker border-t border-kanovi-cream/30 dark:border-white/5">
          <div className="mb-4 pt-4"><label className="block text-xs font-bold uppercase tracking-wide text-kanovi-coffee/70 dark:text-kanovi-cream/70 mb-2">Nama Customer</label><input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Opsional" className="w-full px-4 py-3 bg-white dark:bg-black/20 border border-kanovi-cream dark:border-white/10 rounded-xl text-sm text-kanovi-coffee dark:text-white focus:outline-none focus:ring-2 focus:ring-kanovi-wood" /></div>
          <div className="flex justify-between items-end mb-4 pt-4"><span className="text-kanovi-coffee/80 dark:text-kanovi-cream/80 font-semibold text-sm">Total Tagihan</span><span className="text-xl font-bold text-kanovi-coffee dark:text-white">Rp {totalTagihan.toLocaleString("id-ID")}</span></div>
          <div className="flex flex-col gap-2.5">
            <button onClick={() => setIsCashModalOpen(true)} disabled={cart.length === 0 || isSubmitting} className="w-full py-3 md:py-3.5 bg-kanovi-wood hover:bg-kanovi-coffee text-white font-bold text-xs md:text-sm rounded-xl shadow-md active:scale-[0.98] transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">BAYAR TUNAI</button>
            <button onClick={() => setIsQrisModalOpen(true)} disabled={cart.length === 0 || isSubmitting} className="w-full py-3 md:py-3.5 bg-kanovi-darker dark:bg-black/50 hover:bg-kanovi-coffee dark:hover:bg-kanovi-dark text-white font-bold text-xs md:text-sm rounded-xl shadow-md border border-kanovi-wood/30 active:scale-[0.98] transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">QRIS MANUAL</button>
          </div>
        </div>
      </aside>

      {isSidebarOpen && (
        <div className="fixed inset-0 z-100 flex">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setIsSidebarOpen(false)} />
          <div className="relative w-72 bg-kanovi-paper/95 dark:bg-kanovi-darker/95 backdrop-blur-md h-full shadow-2xl flex flex-col border-r border-kanovi-cream/30 dark:border-white/5 animate-in slide-in-from-left duration-300">
            <div className="p-6 border-b border-kanovi-cream/30 dark:border-white/5 flex items-center justify-between">
              <div><h2 className="text-xl font-bold text-kanovi-coffee dark:text-white">Menu Navigasi</h2><p className="text-xs text-kanovi-coffee/60 dark:text-kanovi-cream/60">POS Kanovi</p></div>
              <button onClick={() => setIsSidebarOpen(false)} className="p-2"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 space-y-2 flex-1">
              <button onClick={() => router.push('/queue')} className="w-full flex items-center gap-3 px-4 py-4 rounded-xl hover:bg-yellow-500/10 text-kanovi-coffee dark:text-white hover:text-yellow-600 font-semibold transition-colors"><MonitorPlay className="w-5 h-5" /> Layar Antrian</button>
              <button onClick={() => router.push('/history')} className="w-full flex items-center gap-3 px-4 py-4 rounded-xl hover:bg-kanovi-bone dark:hover:bg-white/5 text-kanovi-coffee dark:text-white font-semibold transition-colors"><History className="w-5 h-5" /> Riwayat Transaksi</button>
              
              <button 
                onClick={() => { setIsSidebarOpen(false); setIsExpenseOpen(true); }}
                className="w-full flex items-center gap-3 px-4 py-4 rounded-xl hover:bg-red-500/10 text-kanovi-coffee dark:text-white hover:text-red-600 font-semibold transition-colors"
              >
                <Receipt className="w-5 h-5 text-red-500" /> Catat Pengeluaran
              </button>

              <button 
                onClick={() => { setIsSidebarOpen(false); setIsClosingOpen(true); }}
                className="w-full flex items-center gap-3 px-4 py-4 rounded-xl hover:bg-orange-500/10 text-kanovi-coffee dark:text-white hover:text-orange-600 font-semibold transition-colors"
              >
                <Calculator className="w-5 h-5 text-orange-500" /> Tutup Kasir (Closing)
              </button>
            </div>
            <div className="p-4 border-t border-kanovi-cream/30 dark:border-white/5">
              <button onClick={() => { document.cookie = "kanovi_token=; path=/; max-age=0;"; router.push("/login"); }} className="w-full flex items-center gap-3 px-4 py-4 rounded-xl bg-red-50 text-red-600 font-bold transition-colors"><LogOut className="w-5 h-5" /> Keluar</button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODALS --- */}
      <ClearCartModal isOpen={isClearCartModalOpen} onClose={() => setIsClearCartModalOpen(false)} onConfirm={() => { setCart([]); setIsClearCartModalOpen(false); }} />
      <CashModal isOpen={isCashModalOpen} onClose={() => setIsCashModalOpen(false)} totalTagihan={totalTagihan} cashReceived={cashReceived} setCashReceived={setCashReceived} uniqueSuggestedAmounts={uniqueSuggestedAmounts} isEnough={cashNum >= totalTagihan} kembalian={cashNum - totalTagihan} cashNum={cashNum} isSubmitting={isSubmitting} onProcess={handleProcessPayment} />
      <QrisModal isOpen={isQrisModalOpen} onClose={() => setIsQrisModalOpen(false)} totalTagihan={totalTagihan} isSubmitting={isSubmitting} onProcess={handleProcessPayment} />
      <ShortageModal isOpen={isShortageModalOpen} shortages={shortages} overrideReason={overrideReason} setOverrideReason={setOverrideReason} isSubmitting={isSubmitting} onCancel={() => setIsShortageModalOpen(false)} onProcess={handleProcessPayment} pendingMethod={pendingPaymentMethod} />
      <SuccessModal isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)} finalChange={finalChange} />

      <ExpenseModal 
        isOpen={isExpenseOpen} 
        onClose={() => setIsExpenseOpen(false)} 
        sessionId={activeSession?.id} 
      />
      <ClosingModal 
        isOpen={isClosingOpen} 
        onClose={() => setIsClosingOpen(false)} 
        sessionId={activeSession?.id} 
        onClosingSuccess={() => {
          setActiveSession(null); 
          setIsClosingOpen(false);
          document.cookie = "kanovi_token=; path=/; max-age=0;";
          router.push("/login");
        }} 
      />
    </div>
  );
}