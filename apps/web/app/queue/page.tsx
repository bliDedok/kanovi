"use client";

import { useState, useEffect } from "react";
import { Clock, CheckCircle, Coffee, PlayCircle, ArrowLeft, Sun, Moon } from "lucide-react";
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
  
  // State untuk Tema
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
    // Load Tema
    const savedTheme = localStorage.getItem("kanovi_theme");
    if (savedTheme === "dark" || document.documentElement.classList.contains("dark")) {
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
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus as any } : o))
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

  return (
    <div className="min-h-screen bg-kanovi-paper dark:bg-kanovi-darker p-4 md:p-6 font-sans transition-colors duration-300">
      
      {/* --- HEADER --- */}
      <div className="flex justify-between items-center mb-6 bg-kanovi-bone dark:bg-[#1a1a1a] p-4 rounded-2xl shadow-sm border border-kanovi-cream/50 dark:border-white/5">
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/pos')}
            className="p-3 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition text-kanovi-coffee dark:text-gray-200 border border-kanovi-cream/50 dark:border-transparent"
          >
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
          
          <button
            onClick={toggleTheme}
            className="p-3 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition text-kanovi-coffee dark:text-yellow-400 border border-kanovi-cream/50 dark:border-transparent"
          >
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
              <div 
                key={order.id} 
                className={`flex flex-col rounded-3xl shadow-lg border-2 overflow-hidden transition-all duration-300
                  ${isOverdue && order.status !== 'READY' 
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/10' 
                    : order.status === 'READY'
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/10' 
                    : 'border-transparent bg-kanovi-bone dark:bg-[#1a1a1a]'
                  }`}
              >
                {/* Header Kartu (Warna menyesuaikan status agar mudah dilihat koki) */}
                <div className={`p-5 text-white flex justify-between items-center
                  ${order.status === 'NEW' ? 'bg-blue-600 dark:bg-blue-600/80' : 
                    order.status === 'IN_PROGRESS' ? 'bg-orange-500 dark:bg-orange-600/80' : 'bg-green-600 dark:bg-green-600/80'}`}>
                  <div>
                    <span className="text-xs font-bold uppercase opacity-80 block tracking-wider">Order</span>
                    <span className="text-2xl font-black">#{order.id}</span>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <span className="text-xs font-bold uppercase opacity-80 block tracking-wider">Tunggu</span>
                    <span className="text-xl font-bold flex items-center gap-1.5 bg-black/20 px-2 py-1 rounded-lg">
                      <Clock className="w-5 h-5" /> 
                      {diffMins}m
                    </span>
                  </div>
                </div>

                {/* Nama Customer */}
                <div className="px-5 py-3 bg-white/50 dark:bg-black/20 border-b border-kanovi-cream/50 dark:border-white/5 font-bold text-kanovi-coffee dark:text-gray-200 text-lg">
                  {order.customerName || "Pelanggan Counter"}
                </div>

                {/* List Item */}
                <div className="p-5 flex-1">
                  <ul className="space-y-4">
                    {order.details.map((item) => (
                      <li key={item.id} className="flex justify-between items-center text-kanovi-coffee dark:text-gray-300">
                        <span className="font-semibold text-lg leading-tight pr-4">
                          {item.menu.name}
                        </span>
                        <span className="font-black text-xl bg-white dark:bg-gray-800 border border-kanovi-cream/50 dark:border-white/10 w-10 h-10 flex items-center justify-center rounded-xl shrink-0 shadow-sm text-kanovi-wood dark:text-yellow-500">
                          {item.qty}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action Buttons */}
                <div className="p-5 bg-white/30 dark:bg-black/20 mt-auto border-t border-kanovi-cream/50 dark:border-white/5">
                  {order.status === 'NEW' && (
                    <button 
                      onClick={() => updateStatus(order.id, 'IN_PROGRESS')}
                      className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors text-lg shadow-md"
                    >
                      <PlayCircle className="w-6 h-6" /> Proses Pesanan
                    </button>
                  )}
                  {order.status === 'IN_PROGRESS' && (
                    <button 
                      onClick={() => updateStatus(order.id, 'READY')}
                      className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors text-lg shadow-md"
                    >
                      <CheckCircle className="w-6 h-6" /> Selesai Dibuat
                    </button>
                  )}
                  {order.status === 'READY' && (
                    <button 
                      onClick={() => updateStatus(order.id, 'DONE')}
                      className="w-full py-3 bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 font-bold rounded-xl flex items-center justify-center transition-colors hover:bg-green-200 dark:hover:bg-green-500/20 border border-green-200 dark:border-green-500/20"
                    >
                      Sembunyikan dari Layar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}