"use client";

// ====== 1. BAGIAN IMPORTS & TYPES ======
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Trash2, AlertTriangle, Menu as MenuIcon, X, MonitorPlay, History, LogOut } from "lucide-react";

type PaymentMethod = "CASH" | "QRIS";

type Menu = {
  id: number;
  name: string;
  price: number;
  categoryId?: number | null;
  category?: {
    id: number;
    name: string;
    slug: string;
  } | null;
};

type CartItem = Menu & {
  qty: number;
};

type JwtPayload = {
  userId?: number;
  id?: number;
  role?: string;
  exp?: number;
};

type ShortageItem = {
  ingredientId: number;
  ingredientName: string;
  unit: string;
  stock: number;
  need: number;
  shortBy: number;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3001";

export default function POSPage() {
  const router = useRouter();

  // ====== 2. BAGIAN STATE MANAGEMENT ======
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [customerName, setCustomerName] = useState("");
  const [cashReceived, setCashReceived] = useState("");
  const [isCashModalOpen, setIsCashModalOpen] = useState(false);
  const [isQrisModalOpen, setIsQrisModalOpen] = useState(false);
  const [isClearCartModalOpen, setIsClearCartModalOpen] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [finalChange, setFinalChange] = useState(0);

  const [isShortageModalOpen, setIsShortageModalOpen] = useState(false);
  const [pendingPaymentMethod, setPendingPaymentMethod] = useState<PaymentMethod | null>(null);
  const [pendingOrderId, setPendingOrderId] = useState<number | null>(null);
  const [shortages, setShortages] = useState<ShortageItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [overrideReason, setOverrideReason] = useState("");

  const [cart, setCart] = useState<CartItem[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [menus, setMenus] = useState<Menu[]>([]);

  // STATE BARU UNTUK BURGER MENU
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // ====== 3. BAGIAN HELPER & FETCH DATA ======
  const getToken = () =>
    document.cookie
      .split("; ")
      .find((row) => row.startsWith("kanovi_token="))
      ?.split("=")[1];

  const decodeJwtPayload = (token: string): JwtPayload | null => {
    try {
      const parts = token.split(".");
      if (parts.length < 2) return null;
      const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
      const json = atob(padded);
      return JSON.parse(json) as JwtPayload;
    } catch {
      return null;
    }
  };

  const fetchMenus = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const res = await fetch(`${API_BASE}/api/menus`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      if (res.ok) {
        const data = await res.json();
        setMenus(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Gagal mengambil data menu", error);
    }
  };

  // ====== 4. BAGIAN API ORDERS ======
  const createDraftOrder = async () => {
    const token = getToken();
    if (!token) throw new Error("Token login tidak ditemukan. Silakan login ulang.");

    const res = await fetch(`${API_BASE}/api/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        origin: "COUNTER",
        customerName: customerName.trim() || undefined,
        items: cart.map((item) => ({ menuId: item.id, qty: item.qty })),
      }),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.message || data?.error || "Gagal membuat order.");
    return data;
  };

  const checkOrderStock = async (orderId: number) => {
    const token = getToken();
    if (!token) throw new Error("Token login tidak ditemukan. Silakan login ulang.");

    const res = await fetch(`${API_BASE}/api/orders/${orderId}/stock-check`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error(data?.message || data?.error || "Gagal cek stok.");
    return data as { hasShortage: boolean; shortages: ShortageItem[]; };
  };
  
  const payOrder = async (orderId: number, method: PaymentMethod, overrideStock = false, reason?: string) => {
    const token = getToken();
    if (!token) throw new Error("Token login tidak ditemukan. Silakan login ulang.");

    const res = await fetch(`${API_BASE}/api/orders/${orderId}/pay`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        paymentMethod: method, overrideStock,
        overrideNote: overrideStock ? (reason || "Override tanpa alasan spesifik") : undefined,
      }),
    });

    const data = await res.json().catch(() => null);

    if (res.status === 409 && data?.error === "STOCK_NOT_ENOUGH") {
      return { kind: "SHORTAGE" as const, shortages: Array.isArray(data?.shortages) ? data.shortages : [] };
    }

    if (!res.ok) throw new Error(data?.message || data?.error || "Gagal memproses pembayaran.");
    return { kind: "SUCCESS" as const, data };
  };

  // ====== 5. BAGIAN LOGIKA KERANJANG (CART) & UI LOGIC ======
  const openCashModal = () => { setCashReceived(""); setIsCashModalOpen(true); };
  const closeCashModal = () => { setCashReceived(""); setIsCashModalOpen(false); };
  const openQrisModal = () => { setIsQrisModalOpen(true); };

  useEffect(() => {
    fetchMenus();
    const savedTheme = localStorage.getItem("kanovi_theme");
    if (savedTheme === "dark" || document.documentElement.classList.contains("dark")) {
      setIsDarkMode(true); document.documentElement.classList.add("dark");
    }
    const savedCart = localStorage.getItem("kanovi_cart");
    if (savedCart) {
      try { setCart(JSON.parse(savedCart)); } catch { localStorage.removeItem("kanovi_cart"); }
    }
    setIsDataLoaded(true);
  }, []);

  useEffect(() => {
    if (isDataLoaded) { localStorage.setItem("kanovi_cart", JSON.stringify(cart)); }
  }, [cart, isDataLoaded]);

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove("dark"); localStorage.setItem("kanovi_theme", "light"); setIsDarkMode(false);
    } else {
      document.documentElement.classList.add("dark"); localStorage.setItem("kanovi_theme", "dark"); setIsDarkMode(true);
    }
  };

  const addToCart = (menu: Menu) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === menu.id);
      if (existingItem) { return prevCart.map((item) => item.id === menu.id ? { ...item, qty: item.qty + 1 } : item); }
      return [...prevCart, { ...menu, qty: 1 }];
    });
  };

  const updateQty = (id: number, delta: number) => {
    setCart((prevCart) => {
      return prevCart
        .map((item) => {
          if (item.id === id) { const newQty = item.qty + delta; return { ...item, qty: newQty > 0 ? newQty : 0 }; }
          return item;
        }).filter((item) => item.qty > 0);
    });
  };

  const confirmClearCart = () => {
    setCart([]); setCustomerName(""); setPendingOrderId(null);
    setPendingPaymentMethod(null); setShortages([]); setIsClearCartModalOpen(false);
  };

  const totalTagihan = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  const categoryOptions = useMemo(() => {
    const map = new Map<number, { id: number; name: string; slug: string }>();
    menus.forEach((menu) => {
      if (menu.category?.id) { map.set(menu.category.id, { id: menu.category.id, name: menu.category.name, slug: menu.category.slug }); }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [menus]);

  const filteredMenus = (Array.isArray(menus) ? menus : []).filter((menu) => {
    const matchSearch = menu.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory = selectedCategory === "ALL" ? true : String(menu.category?.id ?? "") === selectedCategory;
    return matchSearch && matchCategory;
  });

  const cashNum = parseInt(cashReceived.replace(/[^0-9]/g, "")) || 0;
  const kembalian = cashNum - totalTagihan;
  const isEnough = cashNum >= totalTagihan;

  const suggestedAmounts = [totalTagihan];
  const nextTenThousand = Math.ceil(totalTagihan / 10000) * 10000;
  if (nextTenThousand > totalTagihan) suggestedAmounts.push(nextTenThousand);
  if (totalTagihan < 50000) suggestedAmounts.push(50000);
  if (totalTagihan < 100000) suggestedAmounts.push(100000);

  const uniqueSuggestedAmounts = Array.from(new Set(suggestedAmounts)).sort((a, b) => a - b).slice(0, 4);

  // ====== 6. BAGIAN HANDLER TRANSAKSI ======
  const handlePaymentSuccess = (method: PaymentMethod) => {
    setFinalChange(method === "CASH" ? Math.max(kembalian, 0) : 0);
    setCart([]); setCustomerName(""); setCashReceived(""); setOverrideReason(""); 
    setIsCashModalOpen(false); setIsQrisModalOpen(false); setIsShortageModalOpen(false);
    setPendingPaymentMethod(null); setPendingOrderId(null); setShortages([]);
    setShowSuccessModal(true);
  };

  const handleProcessPayment = async (method: PaymentMethod, overrideStock = false) => {
    if (cart.length === 0) return;
    if (method === "CASH" && !overrideStock && !isEnough) return;
    if (overrideStock && !overrideReason.trim()) { alert("Alasan override wajib diisi!"); return; }

    setIsSubmitting(true);
    try {
      let orderId: number;
      if (pendingOrderId !== null) { orderId = pendingOrderId; } 
      else {
        const draft = await createDraftOrder();
        if (!draft?.id) throw new Error("Gagal membuat draft order.");
        orderId = Number(draft.id); setPendingOrderId(orderId);
      }

      if (!overrideStock) {
        const stockResult = await checkOrderStock(orderId);
        if (stockResult.hasShortage) {
          setPendingPaymentMethod(method); setShortages(stockResult.shortages || []);
          setIsCashModalOpen(false); setIsQrisModalOpen(false); setIsShortageModalOpen(true);
          return;
        }
      }

      const paymentResult = await payOrder(orderId, method, overrideStock, overrideReason);
      if (paymentResult.kind === "SHORTAGE") {
        setPendingPaymentMethod(method); setShortages(paymentResult.shortages || []);
        setIsCashModalOpen(false); setIsQrisModalOpen(false); setIsShortageModalOpen(true);
        return;
      }

      handlePaymentSuccess(method);
    } catch (error) {
      console.error("Gagal memproses pembayaran", error);
      alert(error instanceof Error ? error.message : "Gagal memproses pembayaran.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen bg-kanovi-bone dark:bg-kanovi-dark transition-colors duration-300 font-sans overflow-hidden relative">
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* ========================================================= */}
        {/* HEADER NAVBAR BARU (HANYA INI YANG DIUBAH DARI KODE ASLIMU) */}
        {/* ========================================================= */}
        <header className="h-16 flex items-center justify-between px-4 md:px-6 bg-kanovi-paper dark:bg-kanovi-darker border-b border-kanovi-cream/50 dark:border-white/5 shadow-sm z-10 shrink-0">
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 rounded-xl text-kanovi-coffee dark:text-kanovi-bone hover:bg-kanovi-cream/50 dark:hover:bg-white/10 transition-colors focus:outline-none"
            >
              <MenuIcon className="w-6 h-6" />
            </button>
            <div className="flex flex-col min-w-max">
              <h1 className="text-base md:text-lg font-bold text-kanovi-coffee dark:text-kanovi-bone leading-tight">
                POS Kanovi
              </h1>
              <p className="text-[10px] md:text-xs text-kanovi-coffee/70 dark:text-kanovi-cream/70 -mt-0.5 hidden md:block">
                Sistem Kasir
              </p>
            </div>
          </div>

          {/* TENGAH: Search & Category (Sekarang Sangat Lega) */}
          <div className="flex-1 max-w-2xl mx-4 lg:mx-8 hidden sm:block">
            <div className="flex gap-2 w-full">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-kanovi-wood dark:text-kanovi-cream/50">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Cari menu favorit..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-2 bg-kanovi-bone dark:bg-kanovi-dark border border-kanovi-cream/50 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-kanovi-wood text-kanovi-coffee dark:text-kanovi-bone transition-all"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 bg-kanovi-bone dark:bg-kanovi-dark border border-kanovi-cream/50 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-kanovi-wood text-kanovi-coffee dark:text-kanovi-bone cursor-pointer min-w-35px"
              >
                <option value="ALL">Semua Kategori</option>
                {categoryOptions.map((cat) => (
                  <option key={cat.id} value={String(cat.id)}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center min-w-max">
            <button
              onClick={toggleTheme}
              className="p-2 bg-kanovi-bone dark:bg-kanovi-dark rounded-full hover:bg-kanovi-cream/50 transition-colors text-kanovi-coffee dark:text-kanovi-cream border border-kanovi-cream/50 dark:border-white/10 text-sm"
            >
              {isDarkMode ? "☀️" : "🌙"}
            </button>
          </div>
        </header>

        {/* ========================================================= */}
        {/* BAGIAN BAWAH INI (MAIN & ASIDE) 100% SAMA PERSIS DENGAN KODEMU */}
        {/* ========================================================= */}
        <main className="flex-1 overflow-y-auto p-3 md:p-4 lg:p-6">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-3 sm:gap-4">
            {filteredMenus.map((menu) => (
              <button
                key={menu.id}
                onClick={() => addToCart(menu)}
                className="w-full max-w-32 aspect-square mx-auto bg-kanovi-dark text-white dark:bg-[#EADBC8] dark:text-kanovi-coffee rounded-xl p-3 flex flex-col justify-between items-start text-left shadow-sm active:scale-95 transition-all border border-black/5 dark:border-white/5"
              >
                <span className="font-bold text-xs leading-tight line-clamp-3">
                  {menu.name}
                </span>
                <span className="font-medium text-[11px] opacity-90">
                  Rp {menu.price.toLocaleString("id-ID")}
                </span>
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

      <aside className="w-72 md:w-80 lg:w-96 shrink-0 bg-kanovi-paper dark:bg-kanovi-darker border-l border-kanovi-cream/50 dark:border-white/5 flex flex-col shadow-2xl z-20">
        <div className="h-16 flex items-center justify-between px-4 sm:px-5 pt-2 shrink-0">
          <h2 className="font-bold text-base md:text-lg text-kanovi-coffee dark:text-kanovi-bone flex items-center gap-2">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5"
            >
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            Keranjang
          </h2>

          {cart.length > 0 && (
            <button
              onClick={() => setIsClearCartModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
              title="Kosongkan Keranjang"
            >
              <Trash2 className="w-4 h-4" />
              <span>Bersihkan</span>
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-6 flex flex-col bg-kanovi-paper dark:bg-kanovi-darker">
          {cart.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center opacity-30 text-kanovi-coffee dark:text-kanovi-bone gap-4">
              <ShoppingCart className="w-16 h-16" />
              <p className="text-sm font-medium">Belum ada pesanan</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1 w-full mt-2">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col py-3 border-b border-kanovi-cream/30 dark:border-white/5 last:border-0"
                >
                  <h4 className="font-semibold text-kanovi-coffee dark:text-kanovi-bone text-xs md:text-sm leading-tight mb-1.5">
                    {item.name}
                  </h4>
                  <div className="flex justify-between items-center">
                    <div className="text-kanovi-wood dark:text-kanovi-cream/70 text-xs md:text-sm font-medium">
                      Rp {(item.price * item.qty).toLocaleString("id-ID")}
                    </div>
                    <div className="flex items-center gap-1 md:gap-2 bg-kanovi-bone dark:bg-kanovi-dark rounded-full p-1 border border-kanovi-cream/50 dark:border-white/5">
                      <button
                        onClick={() => updateQty(item.id, -1)}
                        className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-kanovi-paper dark:bg-kanovi-darker flex items-center justify-center text-kanovi-coffee dark:text-kanovi-cream hover:bg-kanovi-wood hover:text-white transition-colors shadow-sm"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 md:w-3.5 md:h-3.5"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                      </button>
                      <span className="font-bold text-xs md:text-sm w-4 md:w-5 text-center text-kanovi-coffee dark:text-kanovi-bone">
                        {item.qty}
                      </span>
                      <button
                        onClick={() => updateQty(item.id, 1)}
                        className="w-6 h-6 md:w-7 md:h-7 rounded-full bg-kanovi-paper dark:bg-kanovi-darker flex items-center justify-center text-kanovi-coffee dark:text-kanovi-cream hover:bg-kanovi-wood hover:text-white transition-colors shadow-sm"
                      >
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
          <div className="mb-4 pt-4">
            <label className="block text-xs font-bold uppercase tracking-wide text-kanovi-coffee/70 dark:text-kanovi-cream/70 mb-2">
              Nama Customer
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Opsional"
              className="w-full px-4 py-3 bg-white dark:bg-black/20 border border-kanovi-cream dark:border-white/10 rounded-xl text-sm text-kanovi-coffee dark:text-kanovi-bone focus:outline-none focus:ring-2 focus:ring-kanovi-wood"
            />
          </div>

          <div className="flex justify-between items-end mb-4 pt-4">
            <span className="text-kanovi-coffee/80 dark:text-kanovi-cream/80 font-semibold text-sm">
              Total Tagihan
            </span>
            <span className="text-xl font-bold text-kanovi-coffee dark:text-kanovi-bone">
              Rp {totalTagihan.toLocaleString("id-ID")}
            </span>
          </div>
          <div className="flex flex-col gap-2.5">
            <button
              onClick={openCashModal}
              disabled={cart.length === 0 || isSubmitting}
              className="w-full py-3 md:py-3.5 bg-kanovi-wood hover:bg-kanovi-coffee text-white font-bold text-xs md:text-sm rounded-xl shadow-md active:scale-[0.98] transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 md:w-5 md:h-5"><rect x="2" y="6" width="20" height="12" rx="2"></rect><circle cx="12" cy="12" r="2"></circle><path d="M6 12h.01M18 12h.01"></path></svg>
              {isSubmitting ? "MEMPROSES..." : "BAYAR TUNAI"}
            </button>

            <button
              onClick={openQrisModal}
              disabled={cart.length === 0 || isSubmitting}
              className="w-full py-3 md:py-3.5 bg-kanovi-darker dark:bg-black/50 hover:bg-kanovi-coffee dark:hover:bg-kanovi-dark text-white font-bold text-xs md:text-sm rounded-xl shadow-md border border-kanovi-wood/30 active:scale-[0.98] transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 md:w-5 md:h-5"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>
              {isSubmitting ? "MEMPROSES..." : "QRIS MANUAL"}
            </button>
          </div>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* SIDEBAR BURGER MENU (GLASSMORPHISM) */}
      {/* ========================================================= */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-100 flex">
          {/* Overlay Gelap */}
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setIsSidebarOpen(false)}
          />

          {/* Panel Menu Melayang */}
          <div className="relative w-72 bg-kanovi-paper/95 dark:bg-kanovi-darker/95 backdrop-blur-md h-full shadow-2xl flex flex-col border-r border-kanovi-cream/30 dark:border-white/5 animate-in slide-in-from-left duration-300">
            <div className="p-6 border-b border-kanovi-cream/30 dark:border-white/5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-kanovi-coffee dark:text-kanovi-bone">Menu Navigasi</h2>
                <p className="text-xs text-kanovi-coffee/60 dark:text-kanovi-cream/60">POS Kanovi</p>
              </div>
              <button 
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 bg-kanovi-bone dark:bg-white/5 hover:bg-kanovi-cream dark:hover:bg-white/10 rounded-full transition-colors text-kanovi-coffee dark:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-2 flex-1">
              <button
                onClick={() => router.push('/queue')}
                className="w-full flex items-center gap-3 px-4 py-4 rounded-xl hover:bg-yellow-500/10 text-kanovi-coffee dark:text-kanovi-bone hover:text-yellow-600 dark:hover:text-yellow-500 font-semibold transition-colors group"
              >
                <MonitorPlay className="w-5 h-5 text-kanovi-wood dark:text-kanovi-cream group-hover:text-yellow-500 transition-colors" />
                Layar Antrian
              </button>

              <button
                onClick={() => router.push('/history')}
                className="w-full flex items-center gap-3 px-4 py-4 rounded-xl hover:bg-kanovi-bone dark:hover:bg-white/5 text-kanovi-coffee dark:text-kanovi-bone font-semibold transition-colors group"
              >
                <History className="w-5 h-5 text-kanovi-wood dark:text-kanovi-cream group-hover:text-white transition-colors" />
                Riwayat Transaksi
              </button>
            </div>

            <div className="p-4 border-t border-kanovi-cream/30 dark:border-white/5">
              <button
                onClick={() => {
                  document.cookie = "kanovi_token=; path=/; max-age=0;";
                  document.cookie = "kanovi_role=; path=/; max-age=0;";
                  router.push("/login");
                }}
                className="w-full flex items-center gap-3 px-4 py-4 rounded-xl bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 font-bold transition-colors border border-transparent hover:border-red-200 dark:hover:border-red-500/30"
              >
                <LogOut className="w-5 h-5" />
                Keluar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL TRANSAKSI BAWAAN (TIDAK ADA YANG DIUBAH) */}
      {/* ========================================================= */}
      {isClearCartModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-kanovi-paper dark:bg-kanovi-darker rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-kanovi-cream/50 dark:border-white/5 relative">
            <div className="w-16 h-16 mx-auto bg-red-100 dark:bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mb-4"><Trash2 className="w-8 h-8" /></div>
            <h3 className="text-xl font-bold text-kanovi-coffee dark:text-kanovi-bone mb-2 text-center">Kosongkan Keranjang?</h3>
            <p className="text-sm text-kanovi-coffee/70 dark:text-kanovi-cream/70 text-center mb-6">Semua pesanan yang sudah diinput akan dihapus dan tidak bisa dikembalikan.</p>
            <div className="flex gap-3">
              <button onClick={() => setIsClearCartModalOpen(false)} className="flex-1 py-3 bg-kanovi-bone dark:bg-white/5 hover:bg-kanovi-cream/50 dark:hover:bg-white/10 text-kanovi-coffee dark:text-kanovi-bone font-bold rounded-xl transition-colors">Batal</button>
              <button onClick={confirmClearCart} className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-md transition-colors">Hapus Semua</button>
            </div>
          </div>
        </div>
      )}

      {isCashModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-kanovi-paper dark:bg-kanovi-darker rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-kanovi-cream/50 dark:border-white/5 relative">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-kanovi-coffee dark:text-kanovi-bone">Pembayaran Tunai</h3>
              <button onClick={closeCashModal} className="text-2xl text-kanovi-coffee dark:text-kanovi-bone opacity-50">&times;</button>
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
            <div className={`p-4 rounded-xl mb-6 flex justify-between items-center border ${isEnough ? "bg-green-100 dark:bg-green-900/20 border-green-200 text-green-700 dark:text-green-400" : "bg-red-100 dark:bg-red-900/20 border-red-200 text-red-600 dark:text-red-400"}`}>
              <span className="font-bold text-sm">{isEnough ? "Kembalian" : "Kurang"}</span>
              <span className="text-xl font-bold">Rp {Math.abs(kembalian).toLocaleString("id-ID")}</span>
            </div>
            <button onClick={() => handleProcessPayment("CASH")} disabled={!isEnough || cashNum === 0 || isSubmitting} className="w-full py-4 bg-kanovi-wood hover:bg-kanovi-coffee text-white font-bold rounded-xl shadow-md disabled:opacity-50 transition-colors">
              {isSubmitting ? "Memproses..." : "Selesaikan Pembayaran"}
            </button>
          </div>
        </div>
      )}

      {isQrisModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-kanovi-paper dark:bg-kanovi-darker rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-kanovi-cream/50 dark:border-white/5 relative">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-kanovi-coffee dark:text-kanovi-bone">Pembayaran QRIS</h3>
              <button onClick={() => setIsQrisModalOpen(false)} className="text-2xl text-kanovi-coffee dark:text-kanovi-bone opacity-50">&times;</button>
            </div>
            <div className="bg-kanovi-bone dark:bg-kanovi-dark p-6 rounded-xl mb-6 text-center border border-kanovi-cream/30 dark:border-white/5">
              <p className="text-sm text-kanovi-coffee/70 dark:text-kanovi-cream/70 font-bold uppercase mb-2">Total Tagihan</p>
              <p className="text-4xl font-black text-kanovi-wood dark:text-kanovi-cream">Rp {totalTagihan.toLocaleString("id-ID")}</p>
            </div>
            <button onClick={() => handleProcessPayment("QRIS")} disabled={isSubmitting} className="w-full py-4 bg-kanovi-wood hover:bg-kanovi-coffee text-white font-bold rounded-xl shadow-md transition-colors disabled:opacity-50">
              {isSubmitting ? "Memproses..." : "Konfirmasi Uang Masuk"}
            </button>
          </div>
        </div>
      )}

      {isShortageModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-kanovi-paper dark:bg-kanovi-darker rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-yellow-500/50 dark:border-yellow-400/30 relative text-center">
            <div className="w-16 h-16 mx-auto bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 rounded-full flex items-center justify-center mb-4"><AlertTriangle className="w-8 h-8" /></div>
            <h3 className="text-xl font-bold text-kanovi-coffee dark:text-kanovi-bone mb-2">Stok Sistem Tidak Cukup</h3>
            <p className="text-sm text-kanovi-coffee/80 dark:text-kanovi-cream/80 mb-4 px-2">Sistem mendeteksi kekurangan stok. Kalau stok fisik masih ada, transaksi bisa dilanjutkan dengan override.</p>
            {shortages.length > 0 && (
              <div className="mb-4 max-h-40 overflow-y-auto text-left bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-400/20 rounded-xl p-3">
                <div className="text-xs font-bold mb-2 text-yellow-700 dark:text-yellow-300">Detail shortage:</div>
                <div className="space-y-2">
                  {shortages.map((item) => (
                    <div key={item.ingredientId} className="text-xs text-kanovi-coffee dark:text-kanovi-bone">
                      <div className="font-semibold">{item.ingredientName}</div>
                      <div>Stock: {item.stock} {item.unit} · Need: {item.need} {item.unit}</div>
                      <div>Kurang: {item.shortBy} {item.unit}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="mb-5 text-left">
              <label className="block text-sm font-bold text-kanovi-coffee dark:text-kanovi-bone mb-2">Alasan Override <span className="text-red-500">*wajib</span></label>
              <textarea className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-kanovi-darker text-kanovi-coffee dark:text-kanovi-bone focus:ring-2 focus:ring-yellow-500 focus:outline-none" placeholder="Cth: Sisa susu di kulkas masih ada..." value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} rows={2} required />
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setIsShortageModalOpen(false); setPendingPaymentMethod(null); setPendingOrderId(null); setShortages([]); setOverrideReason(""); }} className="flex-1 py-3 bg-kanovi-bone dark:bg-white/5 hover:bg-kanovi-cream/50 dark:hover:bg-white/10 text-kanovi-coffee dark:text-kanovi-bone font-bold rounded-xl transition-colors border border-kanovi-cream/50 dark:border-white/10">Batal Transaksi</button>
              <button onClick={() => { if (pendingPaymentMethod) { handleProcessPayment(pendingPaymentMethod, true); } }} disabled={isSubmitting || !overrideReason.trim()} className="flex-1 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-xl shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed">{isSubmitting ? "Memproses..." : "Lanjut Override"}</button>
            </div>
          </div>
        </div>
      )}

      {showSuccessModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-kanovi-paper dark:bg-kanovi-darker rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center border border-kanovi-cream/50 dark:border-white/5">
            <div className="w-20 h-20 mx-auto bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mb-6"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-10 h-10"><polyline points="20 6 9 17 4 12"></polyline></svg></div>
            <h2 className="text-2xl font-bold mb-2 text-kanovi-coffee dark:text-kanovi-bone">Pembayaran Berhasil!</h2>
            <div className="bg-kanovi-bone dark:bg-kanovi-dark rounded-xl p-4 mb-8 mt-4 border border-kanovi-cream/50 dark:border-white/5">
              <p className="text-xs text-kanovi-coffee/70 dark:text-kanovi-cream/70 font-bold uppercase mb-1">Kembalian</p>
              <p className="text-3xl font-bold text-kanovi-wood dark:text-kanovi-cream">Rp {finalChange.toLocaleString("id-ID")}</p>
            </div>
            <button onClick={() => setShowSuccessModal(false)} className="w-full py-4 bg-kanovi-wood hover:bg-kanovi-coffee text-white font-bold rounded-xl text-lg transition-colors">Pesanan Baru</button>
          </div>
        </div>
      )}
    </div>
  );
}