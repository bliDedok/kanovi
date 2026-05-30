"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Banknote,
  CheckCircle2,
  Coffee,
  History,
  LogOut,
  Menu as MenuIcon,
  Minus,
  MonitorPlay,
  Moon,
  Plus,
  Search,
  ShoppingCart,
  Smartphone,
  Sun,
  Trash2,
  User,
  X,
} from "lucide-react";

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
  const [pendingPaymentMethod, setPendingPaymentMethod] =
    useState<PaymentMethod | null>(null);
  const [pendingOrderId, setPendingOrderId] = useState<number | null>(null);
  const [shortages, setShortages] = useState<ShortageItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");

  const [cart, setCart] = useState<CartItem[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

  const createDraftOrder = async () => {
    const token = getToken();

    if (!token) {
      throw new Error("Token login tidak ditemukan. Silakan login ulang.");
    }

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

    if (!res.ok) {
      throw new Error(data?.message || data?.error || "Gagal membuat order.");
    }

    return data;
  };

  const checkOrderStock = async (orderId: number) => {
    const token = getToken();

    if (!token) {
      throw new Error("Token login tidak ditemukan. Silakan login ulang.");
    }

    const res = await fetch(`${API_BASE}/api/orders/${orderId}/stock-check`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(data?.message || data?.error || "Gagal cek stok.");
    }

    return data as { hasShortage: boolean; shortages: ShortageItem[] };
  };

  const payOrder = async (
    orderId: number,
    method: PaymentMethod,
    overrideStock = false,
    reason?: string
  ) => {
    const token = getToken();

    if (!token) {
      throw new Error("Token login tidak ditemukan. Silakan login ulang.");
    }

    const res = await fetch(`${API_BASE}/api/orders/${orderId}/pay`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        paymentMethod: method,
        overrideStock,
        overrideNote: overrideStock
          ? reason || "Override tanpa alasan spesifik"
          : undefined,
      }),
    });

    const data = await res.json().catch(() => null);

    if (res.status === 409 && data?.error === "STOCK_NOT_ENOUGH") {
      return {
        kind: "SHORTAGE" as const,
        shortages: Array.isArray(data?.shortages) ? data.shortages : [],
      };
    }

    if (!res.ok) {
      throw new Error(
        data?.message || data?.error || "Gagal memproses pembayaran."
      );
    }

    return { kind: "SUCCESS" as const, data };
  };

  const openCashModal = () => {
    setCashReceived("");
    setIsCashModalOpen(true);
  };

  const closeCashModal = () => {
    setCashReceived("");
    setIsCashModalOpen(false);
  };

  const openQrisModal = () => {
    setIsQrisModalOpen(true);
  };

  useEffect(() => {
    fetchMenus();

    const savedTheme = localStorage.getItem("kanovi_theme");

    if (
      savedTheme === "dark" ||
      document.documentElement.classList.contains("dark")
    ) {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    }

    const token = getToken();
    if (token) decodeJwtPayload(token);

    const savedCart = localStorage.getItem("kanovi_cart");

    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch {
        localStorage.removeItem("kanovi_cart");
      }
    }

    setIsDataLoaded(true);
  }, []);

  useEffect(() => {
    if (isDataLoaded) {
      localStorage.setItem("kanovi_cart", JSON.stringify(cart));
    }
  }, [cart, isDataLoaded]);

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

  const addToCart = (menu: Menu) => {
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
      return prevCart
        .map((item) => {
          if (item.id === id) {
            const newQty = item.qty + delta;
            return { ...item, qty: newQty > 0 ? newQty : 0 };
          }

          return item;
        })
        .filter((item) => item.qty > 0);
    });
  };

  const confirmClearCart = () => {
    setCart([]);
    setCustomerName("");
    setPendingOrderId(null);
    setPendingPaymentMethod(null);
    setShortages([]);
    setIsClearCartModalOpen(false);
  };

  const totalTagihan = cart.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );

  const categoryOptions = useMemo(() => {
    const map = new Map<number, { id: number; name: string; slug: string }>();

    menus.forEach((menu) => {
      if (menu.category?.id) {
        map.set(menu.category.id, {
          id: menu.category.id,
          name: menu.category.name,
          slug: menu.category.slug,
        });
      }
    });

    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [menus]);

  const filteredMenus = (Array.isArray(menus) ? menus : []).filter((menu) => {
    const matchSearch = menu.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    const matchCategory =
      selectedCategory === "ALL"
        ? true
        : String(menu.category?.id ?? "") === selectedCategory;

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

  const uniqueSuggestedAmounts = Array.from(new Set(suggestedAmounts))
    .sort((a, b) => a - b)
    .slice(0, 4);

  const handlePaymentSuccess = (method: PaymentMethod) => {
    setFinalChange(method === "CASH" ? Math.max(kembalian, 0) : 0);
    setCart([]);
    setCustomerName("");
    setCashReceived("");
    setOverrideReason("");
    setIsCashModalOpen(false);
    setIsQrisModalOpen(false);
    setIsShortageModalOpen(false);
    setPendingPaymentMethod(null);
    setPendingOrderId(null);
    setShortages([]);
    setShowSuccessModal(true);
  };

  const handleProcessPayment = async (
    method: PaymentMethod,
    overrideStock = false
  ) => {
    if (cart.length === 0) return;
    if (method === "CASH" && !overrideStock && !isEnough) return;

    if (overrideStock && !overrideReason.trim()) {
      alert("Alasan override wajib diisi!");
      return;
    }

    setIsSubmitting(true);

    try {
      let orderId: number;

      if (pendingOrderId !== null) {
        orderId = pendingOrderId;
      } else {
        const draft = await createDraftOrder();

        if (!draft?.id) {
          throw new Error("Gagal membuat draft order.");
        }

        orderId = Number(draft.id);
        setPendingOrderId(orderId);
      }

      if (!overrideStock) {
        const stockResult = await checkOrderStock(orderId);

        if (stockResult.hasShortage) {
          setPendingPaymentMethod(method);
          setShortages(stockResult.shortages || []);
          setIsCashModalOpen(false);
          setIsQrisModalOpen(false);
          setIsShortageModalOpen(true);
          return;
        }
      }

      const paymentResult = await payOrder(
        orderId,
        method,
        overrideStock,
        overrideReason
      );

      if (paymentResult.kind === "SHORTAGE") {
        setPendingPaymentMethod(method);
        setShortages(paymentResult.shortages || []);
        setIsCashModalOpen(false);
        setIsQrisModalOpen(false);
        setIsShortageModalOpen(true);
        return;
      }

      handlePaymentSuccess(method);
    } catch (error) {
      console.error("Gagal memproses pembayaran", error);
      alert(
        error instanceof Error ? error.message : "Gagal memproses pembayaran."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const surfaceClass =
    "bg-[#edf2f4] shadow-[14px_14px_32px_rgba(130,145,152,0.20),-12px_-12px_28px_rgba(255,255,255,0.92)] dark:bg-white/[0.055] dark:shadow-[14px_14px_32px_rgba(0,0,0,0.32),-7px_-7px_20px_rgba(255,255,255,0.035)]";

  const pressedClass =
    "bg-[#edf2f4] shadow-[inset_6px_6px_12px_rgba(130,145,152,0.20),inset_-6px_-6px_12px_rgba(255,255,255,0.92)] dark:bg-white/[0.06] dark:shadow-[inset_6px_6px_12px_rgba(0,0,0,0.28),inset_-6px_-6px_12px_rgba(255,255,255,0.035)]";

  const softButtonClass =
    "bg-[#edf2f4] shadow-[7px_7px_16px_rgba(130,145,152,0.18),-7px_-7px_16px_rgba(255,255,255,0.92)] transition-all hover:-translate-y-0.5 active:translate-y-0 active:shadow-[inset_5px_5px_10px_rgba(130,145,152,0.22),inset_-5px_-5px_10px_rgba(255,255,255,0.92)] dark:bg-white/[0.07] dark:shadow-[7px_7px_16px_rgba(0,0,0,0.26),-5px_-5px_14px_rgba(255,255,255,0.035)] dark:active:shadow-[inset_5px_5px_10px_rgba(0,0,0,0.28),inset_-5px_-5px_10px_rgba(255,255,255,0.035)]";

  const fieldClass =
    "w-full rounded-2xl bg-[#edf2f4] px-4 py-3 text-sm font-bold text-[#20272c] shadow-[inset_6px_6px_12px_rgba(130,145,152,0.20),inset_-6px_-6px_12px_rgba(255,255,255,0.92)] outline-none placeholder:text-[#8a969c] dark:bg-white/[0.06] dark:text-white dark:shadow-[inset_6px_6px_12px_rgba(0,0,0,0.28),inset_-6px_-6px_12px_rgba(255,255,255,0.035)] dark:placeholder:text-white/35";

  return (
    <div className="relative flex h-screen overflow-hidden bg-[#edf2f4] font-sans text-[#20272c] transition-colors duration-500 dark:bg-[#311B14] dark:text-[#f7efe7]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.95)_0%,rgba(237,242,244,1)_35%,rgba(226,233,236,1)_100%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(92,53,39,0.8)_0%,rgba(49,27,20,1)_45%,rgba(27,13,9,1)_100%)]" />

      <div className="relative z-10 flex h-full min-w-0 flex-1 flex-col overflow-hidden p-4 pr-0">
        <header
          className={`mb-4 flex h-[84px] shrink-0 items-center justify-between rounded-[2rem] px-4 md:px-5 ${surfaceClass}`}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className={`flex h-12 w-12 items-center justify-center rounded-2xl text-[#20272c] dark:text-white ${softButtonClass}`}
            >
              <MenuIcon className="h-5 w-5" />
            </button>

            <div>
              <h1 className="text-xl font-black tracking-tight md:text-2xl">
                POS Kanovi
              </h1>
              <p className="text-xs font-bold text-[#7a858b] dark:text-white/45">
                Sistem kasir staff
              </p>
            </div>
          </div>

          <div className="hidden flex-1 items-center gap-3 px-5 lg:flex">
            <div className="relative max-w-xl flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8a969c] dark:text-white/40" />

              <input
                type="text"
                placeholder="Cari menu favorit..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`${fieldClass} pl-12`}
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={`${fieldClass} max-w-[230px] appearance-none text-[#20272c] dark:text-white`}
            >
              <option className="bg-[#edf2f4] text-[#20272c]" value="ALL">
                Semua Kategori
              </option>

              {categoryOptions.map((cat) => (
                <option
                  key={cat.id}
                  value={String(cat.id)}
                  className="bg-[#edf2f4] text-[#20272c]"
                >
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={toggleTheme}
            className={`flex h-12 w-12 items-center justify-center rounded-2xl text-[#20272c] dark:text-white ${softButtonClass}`}
          >
            {isDarkMode ? (
              <Sun className="h-5 w-5 text-[#FFD28A]" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </button>
        </header>

        <div className="mb-4 grid gap-3 lg:hidden">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8a969c] dark:text-white/40" />
            <input
              type="text"
              placeholder="Cari menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`${fieldClass} pl-12`}
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className={`${fieldClass} appearance-none text-[#20272c] dark:text-white`}
          >
            <option className="bg-[#edf2f4] text-[#20272c]" value="ALL">
              Semua Kategori
            </option>

            {categoryOptions.map((cat) => (
              <option
                key={cat.id}
                value={String(cat.id)}
                className="bg-[#edf2f4] text-[#20272c]"
              >
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <main className="min-h-0 flex-1 overflow-y-auto pr-4">
          {filteredMenus.length === 0 ? (
            <div
              className={`flex h-full flex-col items-center justify-center rounded-[2rem] p-8 text-center ${pressedClass}`}
            >
              <Search className="mb-4 h-10 w-10 text-[#8a969c] dark:text-white/35" />
              <p className="text-sm font-black text-[#7a858b] dark:text-white/45">
                Tidak ada menu yang ditemukan.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              {filteredMenus.map((menu) => (
                <button
                  key={menu.id}
                  onClick={() => addToCart(menu)}
                  className={`group flex aspect-square flex-col justify-between rounded-[2rem] p-5 text-left transition-all duration-300 hover:-translate-y-1 active:translate-y-0 active:shadow-[inset_7px_7px_14px_rgba(130,145,152,0.22),inset_-7px_-7px_14px_rgba(255,255,255,0.92)] dark:active:shadow-[inset_7px_7px_14px_rgba(0,0,0,0.28),inset_-7px_-7px_14px_rgba(255,255,255,0.035)] ${surfaceClass}`}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-[1.3rem] bg-[#edf2f4] text-[#20272c] shadow-[inset_4px_4px_9px_rgba(130,145,152,0.18),inset_-4px_-4px_9px_rgba(255,255,255,0.88)] dark:bg-white/[0.07] dark:text-[#FFD28A] dark:shadow-[inset_4px_4px_9px_rgba(0,0,0,0.24),inset_-4px_-4px_9px_rgba(255,255,255,0.035)]">
                    <Coffee className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="line-clamp-3 text-sm font-black leading-tight text-[#20272c] dark:text-[#f7efe7]">
                      {menu.name}
                    </p>

                    <p className="mt-2 text-xs font-bold text-[#7a858b] dark:text-white/45">
                      {menu.category?.name || "Tanpa kategori"}
                    </p>

                    <p className="mt-3 text-base font-black text-[#20272c] dark:text-white">
                      Rp {menu.price.toLocaleString("id-ID")}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </main>
      </div>

      <aside className="relative z-10 hidden h-full w-[380px] shrink-0 p-4 pl-0 lg:block">
        <div
          className={`flex h-full flex-col overflow-hidden rounded-[2.2rem] ${surfaceClass}`}
        >
          <div className="flex h-20 shrink-0 items-center justify-between px-5">
            <h2 className="flex items-center gap-3 text-xl font-black">
              <span
                className={`flex h-11 w-11 items-center justify-center rounded-2xl ${pressedClass}`}
              >
                <ShoppingCart className="h-5 w-5" />
              </span>
              Keranjang
            </h2>

            {cart.length > 0 && (
              <button
                onClick={() => setIsClearCartModalOpen(true)}
                className="flex items-center gap-2 rounded-2xl bg-red-500/10 px-3 py-2 text-xs font-black text-red-500 transition-all active:scale-95 dark:text-red-300"
              >
                <Trash2 className="h-4 w-4" />
                Bersihkan
              </button>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5">
            {cart.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-4 text-[#8a969c] dark:text-white/35">
                <ShoppingCart className="h-16 w-16" />
                <p className="text-sm font-black">Belum ada pesanan</p>
              </div>
            ) : (
              <div className="space-y-3 pb-4">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className={`rounded-[1.6rem] p-4 ${pressedClass}`}
                  >
                    <h4 className="text-sm font-black leading-tight">
                      {item.name}
                    </h4>

                    <div className="mt-3 flex items-center justify-between">
                      <p className="text-sm font-black text-[#6f7a80] dark:text-white/50">
                        Rp {(item.price * item.qty).toLocaleString("id-ID")}
                      </p>

                      <div className="flex items-center gap-2 rounded-full bg-[#edf2f4] p-1 shadow-[inset_4px_4px_8px_rgba(130,145,152,0.18),inset_-4px_-4px_8px_rgba(255,255,255,0.88)] dark:bg-white/[0.06] dark:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.24),inset_-4px_-4px_8px_rgba(255,255,255,0.035)]">
                        <button
                          onClick={() => updateQty(item.id, -1)}
                          className={`flex h-8 w-8 items-center justify-center rounded-full ${softButtonClass}`}
                        >
                          <Minus className="h-4 w-4" />
                        </button>

                        <span className="w-6 text-center text-sm font-black">
                          {item.qty}
                        </span>

                        <button
                          onClick={() => updateQty(item.id, 1)}
                          className={`flex h-8 w-8 items-center justify-center rounded-full ${softButtonClass}`}
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="shrink-0 space-y-4 border-t border-white/40 p-5 dark:border-white/5">
            <div>
              <label className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-[#8a969c] dark:text-white/40">
                <User className="h-4 w-4" />
                Nama Customer
              </label>

              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Opsional"
                className={fieldClass}
              />
            </div>

            <div className={`rounded-[1.6rem] p-4 ${pressedClass}`}>
              <div className="flex items-end justify-between">
                <span className="text-sm font-black text-[#7a858b] dark:text-white/45">
                  Total Tagihan
                </span>

                <span className="text-2xl font-black">
                  Rp {totalTagihan.toLocaleString("id-ID")}
                </span>
              </div>
            </div>

            <div className="grid gap-3">
              <button
                onClick={openCashModal}
                disabled={cart.length === 0 || isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#20272c] px-5 py-4 text-sm font-black text-white transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-[#311B14]"
              >
                <Banknote className="h-5 w-5" />
                {isSubmitting ? "MEMPROSES..." : "BAYAR TUNAI"}
              </button>

              <button
                onClick={openQrisModal}
                disabled={cart.length === 0 || isSubmitting}
                className={`flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 text-sm font-black text-[#20272c] disabled:cursor-not-allowed disabled:opacity-50 dark:text-white ${softButtonClass}`}
              >
                <Smartphone className="h-5 w-5" />
                {isSubmitting ? "MEMPROSES..." : "QRIS MANUAL"}
              </button>
            </div>
          </div>
        </div>
      </aside>

      {isSidebarOpen && (
        <div className="fixed inset-0 z-[100] flex">
          <div
            className="absolute inset-0 bg-black/45 backdrop-blur-sm"
            onClick={() => setIsSidebarOpen(false)}
          />

          <div
            className={`relative flex h-full w-72 flex-col rounded-r-[2rem] p-4 ${surfaceClass}`}
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black">Menu Navigasi</h2>
                <p className="text-xs font-bold text-[#7a858b] dark:text-white/45">
                  POS Kanovi
                </p>
              </div>

              <button
                onClick={() => setIsSidebarOpen(false)}
                className={`flex h-10 w-10 items-center justify-center rounded-2xl ${softButtonClass}`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-3">
              <button
                onClick={() => router.push("/queue")}
                className={`flex w-full items-center gap-3 rounded-2xl px-4 py-4 text-sm font-black ${softButtonClass}`}
              >
                <MonitorPlay className="h-5 w-5" />
                Layar Antrian
              </button>

              <button
                onClick={() => router.push("/history")}
                className={`flex w-full items-center gap-3 rounded-2xl px-4 py-4 text-sm font-black ${softButtonClass}`}
              >
                <History className="h-5 w-5" />
                Riwayat Transaksi
              </button>
            </div>

            <button
              onClick={() => {
                document.cookie = "kanovi_token=; path=/; max-age=0;";
                document.cookie = "kanovi_role=; path=/; max-age=0;";
                router.push("/login");
              }}
              className="flex w-full items-center gap-3 rounded-2xl bg-red-500/10 px-4 py-4 text-sm font-black text-red-500 transition-all active:scale-[0.98] dark:text-red-300"
            >
              <LogOut className="h-5 w-5" />
              Keluar
            </button>
          </div>
        </div>
      )}

      {isClearCartModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
          <div
            className={`w-full max-w-sm rounded-[2rem] p-6 text-center ${surfaceClass}`}
          >
            <div
              className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl text-red-500 ${pressedClass}`}
            >
              <Trash2 className="h-8 w-8" />
            </div>

            <h3 className="text-xl font-black">Kosongkan Keranjang?</h3>

            <p className="mt-2 text-sm font-bold text-[#6f7a80] dark:text-white/50">
              Semua pesanan yang sudah diinput akan dihapus dan tidak bisa
              dikembalikan.
            </p>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setIsClearCartModalOpen(false)}
                className={`flex-1 rounded-2xl px-4 py-3 text-sm font-black ${softButtonClass}`}
              >
                Batal
              </button>

              <button
                onClick={confirmClearCart}
                className="flex-1 rounded-2xl bg-red-500 px-4 py-3 text-sm font-black text-white transition-all active:scale-[0.98]"
              >
                Hapus Semua
              </button>
            </div>
          </div>
        </div>
      )}

      {isCashModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
          <div className={`relative w-full max-w-sm rounded-[2rem] p-6 ${surfaceClass}`}>
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-black">Pembayaran Tunai</h3>

              <button
                onClick={closeCashModal}
                className={`flex h-10 w-10 items-center justify-center rounded-2xl ${softButtonClass}`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className={`mb-5 rounded-[1.6rem] p-4 text-center ${pressedClass}`}>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8a969c] dark:text-white/40">
                Total Tagihan
              </p>

              <p className="mt-2 text-3xl font-black">
                Rp {totalTagihan.toLocaleString("id-ID")}
              </p>
            </div>

            <label className="mb-2 block text-sm font-black">
              Uang Diterima (Rp)
            </label>

            <input
              type="text"
              inputMode="numeric"
              value={cashReceived ? Number(cashReceived).toLocaleString("id-ID") : ""}
              onChange={(e) =>
                setCashReceived(e.target.value.replace(/[^0-9]/g, ""))
              }
              placeholder="0"
              className={`${fieldClass} text-right text-2xl`}
              autoFocus
            />

            <div className="my-5 grid grid-cols-2 gap-2">
              {uniqueSuggestedAmounts.map((amt, idx) => (
                <button
                  key={idx}
                  onClick={() => setCashReceived(amt.toString())}
                  className={`rounded-2xl px-3 py-3 text-sm font-black ${softButtonClass}`}
                >
                  {amt === totalTagihan
                    ? "Uang Pas"
                    : `Rp ${amt.toLocaleString("id-ID")}`}
                </button>
              ))}
            </div>

            <div
              className={`mb-5 flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-black ${
                isEnough
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
                  : "bg-red-500/10 text-red-500 dark:text-red-300"
              }`}
            >
              <span>{isEnough ? "Kembalian" : "Kurang"}</span>
              <span className="text-xl">
                Rp {Math.abs(kembalian).toLocaleString("id-ID")}
              </span>
            </div>

            <button
              onClick={() => handleProcessPayment("CASH")}
              disabled={!isEnough || cashNum === 0 || isSubmitting}
              className="w-full rounded-2xl bg-[#20272c] px-5 py-4 text-sm font-black text-white transition-all active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-[#311B14]"
            >
              {isSubmitting ? "Memproses..." : "Selesaikan Pembayaran"}
            </button>
          </div>
        </div>
      )}

      {isQrisModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
          <div className={`relative w-full max-w-sm rounded-[2rem] p-6 ${surfaceClass}`}>
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-black">Pembayaran QRIS</h3>

              <button
                onClick={() => setIsQrisModalOpen(false)}
                className={`flex h-10 w-10 items-center justify-center rounded-2xl ${softButtonClass}`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className={`mb-6 rounded-[1.6rem] p-6 text-center ${pressedClass}`}>
              <p className="text-sm font-black uppercase tracking-[0.16em] text-[#8a969c] dark:text-white/40">
                Total Tagihan
              </p>

              <p className="mt-3 text-4xl font-black">
                Rp {totalTagihan.toLocaleString("id-ID")}
              </p>
            </div>

            <button
              onClick={() => handleProcessPayment("QRIS")}
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-[#20272c] px-5 py-4 text-sm font-black text-white transition-all active:scale-[0.99] disabled:opacity-50 dark:bg-white dark:text-[#311B14]"
            >
              {isSubmitting ? "Memproses..." : "Konfirmasi Uang Masuk"}
            </button>
          </div>
        </div>
      )}

      {isShortageModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
          <div className={`w-full max-w-sm rounded-[2rem] p-6 text-center ${surfaceClass}`}>
            <div
              className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl text-yellow-500 ${pressedClass}`}
            >
              <AlertTriangle className="h-8 w-8" />
            </div>

            <h3 className="text-xl font-black">Stok Sistem Tidak Cukup</h3>

            <p className="mt-2 text-sm font-bold text-[#6f7a80] dark:text-white/55">
              Sistem mendeteksi kekurangan stok. Kalau stok fisik masih ada,
              transaksi bisa dilanjutkan dengan override.
            </p>

            {shortages.length > 0 && (
              <div
                className={`my-4 max-h-40 overflow-y-auto rounded-[1.4rem] p-3 text-left ${pressedClass}`}
              >
                <div className="mb-2 text-xs font-black text-yellow-600 dark:text-yellow-300">
                  Detail shortage:
                </div>

                <div className="space-y-2">
                  {shortages.map((item) => (
                    <div key={item.ingredientId} className="text-xs font-bold">
                      <div className="font-black">{item.ingredientName}</div>
                      <div className="text-[#6f7a80] dark:text-white/50">
                        Stock: {item.stock} {item.unit} · Need: {item.need}{" "}
                        {item.unit}
                      </div>
                      <div className="text-red-500 dark:text-red-300">
                        Kurang: {item.shortBy} {item.unit}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-5 text-left">
              <label className="mb-2 block text-sm font-black">
                Alasan Override <span className="text-red-500">*wajib</span>
              </label>

              <textarea
                className={`${fieldClass} min-h-[86px] resize-none`}
                placeholder="Cth: Sisa susu di kulkas masih ada..."
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                rows={2}
                required
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setIsShortageModalOpen(false);
                  setPendingPaymentMethod(null);
                  setPendingOrderId(null);
                  setShortages([]);
                  setOverrideReason("");
                }}
                className={`flex-1 rounded-2xl px-4 py-3 text-sm font-black ${softButtonClass}`}
              >
                Batal
              </button>

              <button
                onClick={() => {
                  if (pendingPaymentMethod) {
                    handleProcessPayment(pendingPaymentMethod, true);
                  }
                }}
                disabled={isSubmitting || !overrideReason.trim()}
                className="flex-1 rounded-2xl bg-yellow-500 px-4 py-3 text-sm font-black text-white transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? "Memproses..." : "Lanjut"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showSuccessModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
          <div className={`w-full max-w-sm rounded-[2rem] p-8 text-center ${surfaceClass}`}>
            <div
              className={`mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[1.6rem] text-emerald-500 ${pressedClass}`}
            >
              <CheckCircle2 className="h-10 w-10" />
            </div>

            <h2 className="text-2xl font-black">Pembayaran Berhasil!</h2>

            <div className={`my-6 rounded-[1.6rem] p-4 ${pressedClass}`}>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#8a969c] dark:text-white/40">
                Kembalian
              </p>

              <p className="mt-2 text-3xl font-black">
                Rp {finalChange.toLocaleString("id-ID")}
              </p>
            </div>

            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full rounded-2xl bg-[#20272c] px-5 py-4 text-sm font-black text-white transition-all active:scale-[0.99] dark:bg-white dark:text-[#311B14]"
            >
              Pesanan Baru
            </button>
          </div>
        </div>
      )}
    </div>
  );
}