"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Calendar,
  ChevronRight,
  Clock,
  Moon,
  ReceiptText,
  Sun,
  Wallet,
} from "lucide-react";
import { useRouter } from "next/navigation";

type OrderDetail = {
  id: number;
  qty: number;
  menu: { name: string };
};

type Order = {
  id: number;
  customerName: string | null;
  status: string;
  orderedAt: string;
  totalPrice: number;
  details: OrderDetail[];
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3001";

export default function HistoryPage() {
  const router = useRouter();

  const [groupedOrders, setGroupedOrders] = useState<
    Record<string, (Order & { dailyNo: number })[]>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const getToken = () =>
    document.cookie
      .split("; ")
      .find((row) => row.startsWith("kanovi_token="))
      ?.split("=")[1];

  useEffect(() => {
    const savedTheme = localStorage.getItem("kanovi_theme");

    if (
      savedTheme === "dark" ||
      document.documentElement.classList.contains("dark")
    ) {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    }

    const fetchHistory = async () => {
      try {
        const token = getToken();
        if (!token) return;

        const res = await fetch(`${API_BASE}/api/orders/history`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const json = await res.json();
          const orders: Order[] = json.data || [];

          const groups: Record<string, (Order & { dailyNo: number })[]> = {};

          orders.forEach((order) => {
            const dateStr = new Date(order.orderedAt).toLocaleDateString(
              "id-ID",
              {
                day: "numeric",
                month: "long",
                year: "numeric",
              }
            );

            if (!groups[dateStr]) {
              groups[dateStr] = [];
            }

            const dailyNo = groups[dateStr].length + 1;
            groups[dateStr].push({ ...order, dailyNo });
          });

          for (const date in groups) {
            groups[date].reverse();
          }

          setGroupedOrders(groups);

          const availableDates = Object.keys(groups).reverse();

          if (availableDates.length > 0) {
            setSelectedDate(availableDates[0]);
          }
        }
      } catch (error) {
        console.error("Gagal mengambil history", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, []);

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

  const dateList = Object.keys(groupedOrders).reverse();

  // ====== Token tema neumorphic Kanovi (sama seperti file UI/UX kamu) ======
  const surfaceClass =
    "bg-[#edf2f4] shadow-[14px_14px_32px_rgba(130,145,152,0.20),-12px_-12px_28px_rgba(255,255,255,0.92)] dark:bg-white/[0.055] dark:shadow-[14px_14px_32px_rgba(0,0,0,0.32),-7px_-7px_20px_rgba(255,255,255,0.035)]";

  const pressedClass =
    "bg-[#edf2f4] shadow-[inset_6px_6px_12px_rgba(130,145,152,0.20),inset_-6px_-6px_12px_rgba(255,255,255,0.92)] dark:bg-white/[0.06] dark:shadow-[inset_6px_6px_12px_rgba(0,0,0,0.28),inset_-6px_-6px_12px_rgba(255,255,255,0.035)]";

  const softButtonClass =
    "bg-[#edf2f4] shadow-[7px_7px_16px_rgba(130,145,152,0.18),-7px_-7px_16px_rgba(255,255,255,0.92)] transition-all hover:-translate-y-0.5 active:translate-y-0 active:shadow-[inset_5px_5px_10px_rgba(130,145,152,0.22),inset_-5px_-5px_10px_rgba(255,255,255,0.92)] dark:bg-white/[0.07] dark:shadow-[7px_7px_16px_rgba(0,0,0,0.26),-5px_-5px_14px_rgba(255,255,255,0.035)] dark:active:shadow-[inset_5px_5px_10px_rgba(0,0,0,0.28),inset_-5px_-5px_10px_rgba(255,255,255,0.035)]";

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-[#edf2f4] font-sans text-[#20272c] transition-colors duration-500 dark:bg-[#311B14] dark:text-[#f7efe7]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.95)_0%,rgba(237,242,244,1)_35%,rgba(226,233,236,1)_100%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(92,53,39,0.8)_0%,rgba(49,27,20,1)_45%,rgba(27,13,9,1)_100%)]" />

      <header className="relative z-10 shrink-0 p-4 md:p-6">
        <div
          className={`flex items-center justify-between rounded-[2rem] px-4 py-4 md:px-5 ${surfaceClass}`}
        >
          <div className="flex min-w-0 items-center gap-3 md:gap-4">
            <button
              onClick={() => router.push("/pos")}
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-[#20272c] dark:text-white ${softButtonClass}`}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <div className="min-w-0">
              <h1 className="flex items-center gap-3 text-xl font-black tracking-tight md:text-3xl">
                <ReceiptText className="h-6 w-6 shrink-0" />
                <span className="truncate">Riwayat Transaksi</span>
              </h1>

              <p className="mt-1 text-xs font-bold text-[#7a858b] dark:text-white/45 md:text-sm">
                Lihat transaksi yang sudah masuk ke sistem.
              </p>
            </div>
          </div>

          <button
            onClick={toggleTheme}
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-[#20272c] dark:text-white ${softButtonClass}`}
          >
            {isDarkMode ? (
              <Sun className="h-5 w-5 text-[#FFD28A]" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </button>
        </div>
      </header>

      <main className="relative z-10 flex min-h-0 flex-1 flex-col gap-4 overflow-hidden px-4 pb-4 md:flex-row md:px-6 md:pb-6">
        <aside
          className={`flex w-full shrink-0 flex-col rounded-[2rem] p-4 md:w-[310px] ${surfaceClass}`}
        >
          <div className="mb-4 hidden md:block">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8a969c] dark:text-white/40">
              Pilih Tanggal
            </p>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-1 md:min-h-0 md:flex-1 md:flex-col md:overflow-y-auto md:overflow-x-hidden md:pb-0">
            {isLoading ? (
              <div
                className={`shrink-0 rounded-2xl px-4 py-4 text-sm font-black text-[#8a969c] md:w-full ${pressedClass}`}
              >
                Memuat tanggal...
              </div>
            ) : dateList.length === 0 ? (
              <div
                className={`shrink-0 rounded-2xl px-4 py-4 text-sm font-black text-[#8a969c] md:w-full ${pressedClass}`}
              >
                Belum ada riwayat.
              </div>
            ) : (
              dateList.map((date) => {
                const isActive = selectedDate === date;
                const txCount = groupedOrders[date].length;

                return (
                  <button
                    key={date}
                    onClick={() => setSelectedDate(date)}
                    className={`flex w-56 shrink-0 items-center justify-between rounded-2xl px-4 py-4 text-left transition-all md:w-full ${
                      isActive
                        ? `${pressedClass} text-[#20272c] dark:text-white`
                        : `${softButtonClass} text-[#6f7a80] dark:text-white/55`
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2 text-sm font-black">
                        <Calendar className="h-4 w-4" />
                        {date}
                      </div>

                      <div className="mt-1 text-xs font-bold text-[#8a969c] dark:text-white/40">
                        {txCount} Transaksi
                      </div>
                    </div>

                    <ChevronRight
                      className={`hidden h-5 w-5 md:block ${
                        isActive ? "opacity-100" : "opacity-0"
                      }`}
                    />
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <section
          className={`flex min-w-0 flex-1 flex-col overflow-hidden rounded-[2rem] ${surfaceClass}`}
        >
          <div className="flex shrink-0 flex-col gap-3 px-5 py-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8a969c] dark:text-white/40">
                Detail Transaksi
              </p>

              <h2 className="mt-1 text-xl font-black tracking-tight md:text-2xl">
                {selectedDate || "Pilih tanggal"}
              </h2>
            </div>

            {selectedDate && (
              <div className={`w-fit rounded-2xl px-4 py-3 ${pressedClass}`}>
                <p className="text-sm font-black">
                  Total: {groupedOrders[selectedDate]?.length || 0} Order
                </p>
              </div>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">
            {!selectedDate ? (
              <div
                className={`flex h-full items-center justify-center rounded-[1.7rem] p-8 text-center text-sm font-black text-[#8a969c] ${pressedClass}`}
              >
                Pilih tanggal untuk melihat riwayat.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                {groupedOrders[selectedDate]?.map((order) => (
                  <div
                    key={order.id}
                    className={`rounded-[1.8rem] p-5 ${pressedClass}`}
                  >
                    <div className="mb-4 flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl ${surfaceClass}`}
                        >
                          <p className="text-[10px] font-black uppercase text-[#8a969c] dark:text-white/40">
                            No
                          </p>
                          <p className="text-lg font-black">#{order.dailyNo}</p>
                        </div>

                        <div>
                          <h3 className="text-base font-black md:text-lg">
                            {order.customerName || "Pelanggan Counter"}
                          </h3>

                          <p className="mt-1 flex items-center gap-1.5 text-xs font-bold text-[#8a969c] dark:text-white/40">
                            <Clock className="h-3.5 w-3.5" />
                            {new Date(order.orderedAt).toLocaleTimeString(
                              "id-ID",
                              {
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase ${
                          order.status === "DONE"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
                            : order.status === "READY"
                              ? "bg-blue-500/10 text-blue-600 dark:text-blue-300"
                              : "bg-amber-500/10 text-amber-600 dark:text-amber-300"
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>

                    <ul className="space-y-2">
                      {order.details.map((item) => (
                        <li
                          key={item.id}
                          className="flex items-center justify-between gap-3 text-sm font-bold"
                        >
                          <span className="flex min-w-0 items-center gap-3">
                            <span
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-black ${surfaceClass}`}
                            >
                              {item.qty}x
                            </span>

                            <span className="truncate">{item.menu.name}</span>
                          </span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-5 flex items-center justify-between border-t border-white/45 pt-4 dark:border-white/5">
                      <span className="text-xs font-bold text-[#8a969c] dark:text-white/40">
                        ID DB: {order.id}
                      </span>

                      <span className="flex items-center gap-2 text-lg font-black">
                        <Wallet className="h-4 w-4" />
                        Rp {order.totalPrice.toLocaleString("id-ID")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}