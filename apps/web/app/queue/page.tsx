"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Coffee,
  Moon,
  PlayCircle,
  RefreshCw,
  Sun,
  Timer,
} from "lucide-react";
import { useRouter } from "next/navigation";

type OrderDetail = {
  id: number;
  qty: number;
  menu: {
    name: string;
    category?: { name: string };
  };
};

type Order = {
  id: number;
  customerName: string | null;
  status: "NEW" | "IN_PROGRESS" | "READY" | "DONE";
  orderedAt: string;
  details: OrderDetail[];
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3001";

export default function UnifiedQueueScreen() {
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isDarkMode, setIsDarkMode] = useState(false);

  const getToken = () =>
    document.cookie
      .split("; ")
      .find((row) => row.startsWith("kanovi_token="))
      ?.split("=")[1];

  const fetchQueue = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const res = await fetch(`${API_BASE}/api/queue`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const json = await res.json();
        setOrders(json.data || []);
      }
    } catch (error) {
      console.error("Gagal mengambil data antrian", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem("kanovi_theme");

    if (
      savedTheme === "dark" ||
      document.documentElement.classList.contains("dark")
    ) {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    }

    fetchQueue();

    const pollingInterval = setInterval(() => {
      fetchQueue();
    }, 10000);

    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => {
      clearInterval(pollingInterval);
      clearInterval(timeInterval);
    };
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

  const updateStatus = async (orderId: number, newStatus: string) => {
    try {
      const token = getToken();
      if (!token) return;

      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId
            ? { ...order, status: newStatus as Order["status"] }
            : order
        )
      );

      await fetch(`${API_BASE}/api/queue/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      fetchQueue();
    } catch (error) {
      console.error("Gagal update status", error);
      alert("Gagal mengupdate status pesanan.");
    }
  };

  const getWaitTimeInfo = (orderedAt: string) => {
    const orderTime = new Date(orderedAt).getTime();
    const diffMins = Math.floor((currentTime.getTime() - orderTime) / 60000);
    const isOverdue = diffMins >= 15;

    return { diffMins, isOverdue };
  };

  const activeOrders = orders.filter((order) => order.status !== "DONE");

  const surfaceClass =
    "bg-[#edf2f4] shadow-[14px_14px_32px_rgba(130,145,152,0.20),-12px_-12px_28px_rgba(255,255,255,0.92)] dark:bg-white/[0.055] dark:shadow-[14px_14px_32px_rgba(0,0,0,0.32),-7px_-7px_20px_rgba(255,255,255,0.035)]";

  const pressedClass =
    "bg-[#edf2f4] shadow-[inset_6px_6px_12px_rgba(130,145,152,0.20),inset_-6px_-6px_12px_rgba(255,255,255,0.92)] dark:bg-white/[0.06] dark:shadow-[inset_6px_6px_12px_rgba(0,0,0,0.28),inset_-6px_-6px_12px_rgba(255,255,255,0.035)]";

  const softButtonClass =
    "bg-[#edf2f4] shadow-[7px_7px_16px_rgba(130,145,152,0.18),-7px_-7px_16px_rgba(255,255,255,0.92)] transition-all hover:-translate-y-0.5 active:translate-y-0 active:shadow-[inset_5px_5px_10px_rgba(130,145,152,0.22),inset_-5px_-5px_10px_rgba(255,255,255,0.92)] dark:bg-white/[0.07] dark:shadow-[7px_7px_16px_rgba(0,0,0,0.26),-5px_-5px_14px_rgba(255,255,255,0.035)] dark:active:shadow-[inset_5px_5px_10px_rgba(0,0,0,0.28),inset_-5px_-5px_10px_rgba(255,255,255,0.035)]";

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#edf2f4] p-4 font-sans text-[#20272c] transition-colors duration-500 dark:bg-[#311B14] dark:text-[#f7efe7] md:p-6">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.95)_0%,rgba(237,242,244,1)_35%,rgba(226,233,236,1)_100%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(92,53,39,0.8)_0%,rgba(49,27,20,1)_45%,rgba(27,13,9,1)_100%)]" />

      <div className="relative z-10 mx-auto max-w-[1700px] space-y-6">
        <header
          className={`flex flex-col gap-4 rounded-[2rem] p-4 md:flex-row md:items-center md:justify-between md:p-5 ${surfaceClass}`}
        >
          <div className="flex min-w-0 items-center gap-4">
            <button
              onClick={() => router.push("/pos")}
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-[#20272c] dark:text-white ${softButtonClass}`}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <div className="min-w-0">
              <h1 className="flex items-center gap-3 text-xl font-black tracking-tight md:text-3xl">
                <Coffee className="h-7 w-7 shrink-0" />
                <span className="hidden truncate sm:inline">
                  Kanovi Station
                </span>
                <span className="sm:hidden">Station</span>
              </h1>

              <p className="mt-1 text-xs font-bold text-[#7a858b] dark:text-white/45 md:text-sm">
                Bar & kitchen queue monitor
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchQueue}
              className={`flex h-12 items-center gap-2 rounded-2xl px-4 text-sm font-black text-[#20272c] dark:text-white ${softButtonClass}`}
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>

            <div
              className={`flex h-12 items-center gap-2 rounded-2xl px-4 font-mono text-sm font-black md:text-base ${pressedClass}`}
            >
              <Clock className="h-4 w-4" />
              {currentTime.toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
              })}
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
          </div>
        </header>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className={`rounded-[1.8rem] p-5 ${surfaceClass}`}>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8a969c] dark:text-white/40">
              Total Aktif
            </p>
            <p className="mt-2 text-3xl font-black">{activeOrders.length}</p>
          </div>

          <div className={`rounded-[1.8rem] p-5 ${surfaceClass}`}>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8a969c] dark:text-white/40">
              Sedang Dibuat
            </p>
            <p className="mt-2 text-3xl font-black">
              {activeOrders.filter((order) => order.status === "IN_PROGRESS").length}
            </p>
          </div>

          <div className={`rounded-[1.8rem] p-5 ${pressedClass}`}>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8a969c] dark:text-white/40">
              Siap Diambil
            </p>
            <p className="mt-2 text-3xl font-black">
              {activeOrders.filter((order) => order.status === "READY").length}
            </p>
          </div>
        </section>

        {isLoading ? (
          <div
            className={`rounded-[2rem] p-10 text-center text-sm font-black text-[#8a969c] ${pressedClass}`}
          >
            Memuat antrian...
          </div>
        ) : activeOrders.length === 0 ? (
          <div
            className={`rounded-[2.4rem] px-6 py-20 text-center ${surfaceClass}`}
          >
            <div
              className={`mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[1.7rem] text-emerald-500 ${pressedClass}`}
            >
              <CheckCircle2 className="h-10 w-10" />
            </div>

            <h2 className="text-2xl font-black">Station Bersih!</h2>

            <p className="mt-2 text-sm font-bold text-[#7a858b] dark:text-white/45">
              Belum ada pesanan yang perlu dikerjakan.
            </p>
          </div>
        ) : (
          <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {activeOrders.map((order) => {
              const { diffMins, isOverdue } = getWaitTimeInfo(order.orderedAt);

              const statusLabel =
                order.status === "NEW"
                  ? "Baru"
                  : order.status === "IN_PROGRESS"
                    ? "Diproses"
                    : "Ready";

              return (
                <div
                  key={order.id}
                  className={`flex min-h-[420px] flex-col overflow-hidden rounded-[2.2rem] p-4 transition-all duration-300 ${
                    isOverdue && order.status !== "READY"
                      ? "bg-red-500/10 shadow-[14px_14px_32px_rgba(130,145,152,0.20),-12px_-12px_28px_rgba(255,255,255,0.92)] dark:bg-red-500/10 dark:shadow-[14px_14px_32px_rgba(0,0,0,0.32),-7px_-7px_20px_rgba(255,255,255,0.035)]"
                      : order.status === "READY"
                        ? "bg-emerald-500/10 shadow-[14px_14px_32px_rgba(130,145,152,0.20),-12px_-12px_28px_rgba(255,255,255,0.92)] dark:bg-emerald-500/10 dark:shadow-[14px_14px_32px_rgba(0,0,0,0.32),-7px_-7px_20px_rgba(255,255,255,0.035)]"
                        : surfaceClass
                  }`}
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8a969c] dark:text-white/40">
                        Order
                      </p>

                      <h2 className="mt-1 text-4xl font-black">#{order.id}</h2>
                    </div>

                    <div
                      className={`rounded-2xl px-4 py-3 text-right ${pressedClass}`}
                    >
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8a969c] dark:text-white/40">
                        Tunggu
                      </p>

                      <p
                        className={`mt-1 flex items-center gap-1.5 text-xl font-black ${
                          isOverdue && order.status !== "READY"
                            ? "text-red-500 dark:text-red-300"
                            : ""
                        }`}
                      >
                        <Timer className="h-5 w-5" />
                        {diffMins}m
                      </p>
                    </div>
                  </div>

                  <div className={`mb-4 rounded-[1.5rem] p-4 ${pressedClass}`}>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8a969c] dark:text-white/40">
                      Customer
                    </p>

                    <p className="mt-1 text-lg font-black">
                      {order.customerName || "Pelanggan Counter"}
                    </p>
                  </div>

                  <div className="mb-4 flex items-center justify-between">
                    <span
                      className={`rounded-full px-3 py-1.5 text-xs font-black uppercase ${
                        order.status === "NEW"
                          ? "bg-blue-500/10 text-blue-600 dark:text-blue-300"
                          : order.status === "IN_PROGRESS"
                            ? "bg-orange-500/10 text-orange-600 dark:text-orange-300"
                            : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
                      }`}
                    >
                      {statusLabel}
                    </span>

                    {isOverdue && order.status !== "READY" && (
                      <span className="rounded-full bg-red-500/10 px-3 py-1.5 text-xs font-black uppercase text-red-500 dark:text-red-300">
                        Overdue
                      </span>
                    )}
                  </div>

                  <div className="min-h-0 flex-1 overflow-y-auto">
                    <ul className="space-y-3">
                      {order.details.map((item) => (
                        <li
                          key={item.id}
                          className={`flex items-center justify-between gap-3 rounded-[1.4rem] p-3 ${pressedClass}`}
                        >
                          <span className="min-w-0 text-base font-black leading-tight">
                            {item.menu.name}
                          </span>

                          <span
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg font-black ${surfaceClass}`}
                          >
                            {item.qty}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-5">
                    {order.status === "NEW" && (
                      <button
                        onClick={() => updateStatus(order.id, "IN_PROGRESS")}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#20272c] px-5 py-4 text-base font-black text-white transition-all active:scale-[0.99] dark:bg-white dark:text-[#311B14]"
                      >
                        <PlayCircle className="h-5 w-5" />
                        Proses Pesanan
                      </button>
                    )}

                    {order.status === "IN_PROGRESS" && (
                      <button
                        onClick={() => updateStatus(order.id, "READY")}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 px-5 py-4 text-base font-black text-white transition-all active:scale-[0.99]"
                      >
                        <CheckCircle2 className="h-5 w-5" />
                        Selesai Dibuat
                      </button>
                    )}

                    {order.status === "READY" && (
                      <button
                        onClick={() => updateStatus(order.id, "DONE")}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 py-4 text-base font-black text-white transition-all active:scale-[0.99]"
                      >
                        <CheckCircle2 className="h-5 w-5" />
                        Sembunyikan dari Layar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </section>
        )}
      </div>
    </div>
  );
}