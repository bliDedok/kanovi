"use client";

import { useState, useEffect } from "react";
import { Coffee, ArrowLeft, Sun, Moon, CheckCircle } from "lucide-react"; // Clock & PlayCircle sudah dihapus karena pindah ke dalam komponen
import { useRouter } from "next/navigation";
import { Order } from "../../types";
import { api } from "../../lib/api";
import QueueCard from "../components/QueueCard";

export default function UnifiedQueueScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isDarkMode, setIsDarkMode] = useState(false);

  const fetchQueue = async () => {
    try {
      const json = await api.getQueue();
      setOrders(json.data || []);
    } catch (error) {
      console.error("Gagal mengambil data antrian", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem("kanovi_theme");
    if (savedTheme === "dark" || document.documentElement.classList.contains("dark")) {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    }

    fetchQueue(); 
    const pollingInterval = setInterval(fetchQueue, 10000); 
    const timeInterval = setInterval(() => setCurrentTime(new Date()), 60000); 

    return () => {
      clearInterval(pollingInterval);
      clearInterval(timeInterval);
    };
  }, []);

  const toggleTheme = () => {
    const isDark = !isDarkMode;
    setIsDarkMode(isDark);
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("kanovi_theme", isDark ? "dark" : "light");
  };

  const updateStatus = async (orderId: number, newStatus: string) => {
    try {
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus as any } : o)));
      
      // 1 BARIS SAKTI UPDATE API
      await api.updateOrderStatus(orderId, newStatus);
      fetchQueue();
    } catch (error) {
      console.error("Gagal update status", error);
      alert("Gagal mengupdate status pesanan.");
    }
  };

  const getWaitTimeInfo = (orderedAt: string) => {
    const orderTime = new Date(orderedAt).getTime();
    const diffMins = Math.floor((currentTime.getTime() - orderTime) / 60000);
    return { diffMins, isOverdue: diffMins >= 15 };
  };

  return (
    <div className="min-h-screen bg-kanovi-paper dark:bg-kanovi-darker p-4 md:p-6 font-sans transition-colors duration-300">
      
      {/* --- HEADER --- */}
      <div className="flex justify-between items-center mb-6 bg-kanovi-bone dark:bg-[#1a1a1a] p-4 rounded-2xl shadow-sm border border-kanovi-cream/50 dark:border-white/5">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/pos')} className="p-3 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition text-kanovi-coffee dark:text-gray-200 border border-kanovi-cream/50 dark:border-transparent">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl md:text-3xl font-bold flex items-center gap-3 text-kanovi-coffee dark:text-white">
            <Coffee className="w-7 h-7 md:w-8 md:h-8 text-yellow-600 dark:text-yellow-500" />
            <span className="hidden sm:inline">KANOVI STATION (BAR & KITCHEN)</span>
            <span className="sm:hidden">STATION</span>
          </h1>
        </div>
        <div className="flex items-center gap-3 md:gap-4">
          <div className="bg-white dark:bg-gray-800 px-4 py-2.5 rounded-xl shadow-sm border border-kanovi-cream/50 dark:border-transparent font-mono text-base md:text-lg text-kanovi-coffee dark:text-gray-200 font-bold">
            {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
          </div>
          <button onClick={toggleTheme} className="p-3 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition text-kanovi-coffee dark:text-yellow-400 border border-kanovi-cream/50 dark:border-transparent">
            {isDarkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* --- MAIN CONTENT --- */}
      {isLoading ? (
        <p className="text-gray-500 dark:text-gray-400 text-center mt-10">Memuat antrian...</p>
      ) : orders.filter(o => o.status !== 'DONE').length === 0 ? (
        <div className="text-center py-20 bg-kanovi-bone dark:bg-[#1a1a1a] rounded-3xl shadow-sm border border-kanovi-cream/50 dark:border-white/5 mt-10">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6 opacity-80" />
          <h2 className="text-2xl font-bold text-kanovi-coffee dark:text-white">Station Bersih!</h2>
          <p className="text-kanovi-coffee/70 dark:text-gray-400 mt-2">Belum ada pesanan yang perlu dikerjakan.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">

          {orders.filter(o => o.status !== 'DONE').map((order) => {
            const { diffMins, isOverdue } = getWaitTimeInfo(order.orderedAt);
            return (
              <QueueCard 
                key={order.id} 
                order={order} 
                diffMins={diffMins} 
                isOverdue={isOverdue} 
                onUpdateStatus={updateStatus} 
              />
            );
          })}

        </div>
      )}
    </div>
  );
}