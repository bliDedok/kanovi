"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Calendar, Receipt, ChevronRight, Sun, Moon } from "lucide-react";
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
  
  const [groupedOrders, setGroupedOrders] = useState<Record<string, (Order & { dailyNo: number })[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  
  // State untuk Dark Mode
  const [isDarkMode, setIsDarkMode] = useState(false);

  const getToken = () =>
    document.cookie.split("; ").find((row) => row.startsWith("kanovi_token="))?.split("=")[1];

  // Efek untuk memuat tema dan data awal
  useEffect(() => {
    // Load Theme dari LocalStorage (Sama seperti di POS)
    const savedTheme = localStorage.getItem("kanovi_theme");
    if (savedTheme === "dark" || document.documentElement.classList.contains("dark")) {
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
            const dateStr = new Date(order.orderedAt).toLocaleDateString('id-ID', {
              day: 'numeric', month: 'long', year: 'numeric'
            });

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

  // Fungsi Toggle Tema
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

  return (
    <div className="h-screen flex flex-col bg-kanovi-paper dark:bg-kanovi-darker font-sans transition-colors duration-300 overflow-hidden">
      
      {/* --- HEADER --- */}
      <div className="shrink-0 bg-white dark:bg-gray-900 px-4 md:px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/pos')}
            className="p-2 md:p-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-xl transition text-kanovi-coffee dark:text-gray-200"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2 md:gap-3 text-kanovi-coffee dark:text-white">
            <Receipt className="w-6 h-6 md:w-7 md:h-7 text-yellow-500" />
            Riwayat Transaksi
          </h1>
        </div>

        {/* Tombol Dark Mode */}
        <button
          onClick={toggleTheme}
          className="p-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition text-kanovi-coffee dark:text-yellow-400 focus:outline-none"
          title="Ganti Tema"
        >
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>

      {/* --- MAIN LAYOUT RESPONSIVE (Flex Col di HP, Flex Row di Desktop) --- */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* --- SIDEBAR TANGGAL (Horizontal Scroll di HP, Vertical di Desktop) --- */}
        <div className="w-full md:w-1/3 lg:w-1/4 max-w-sm border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1a1a1a] flex flex-col z-0">
          <div className="p-4 border-b border-gray-200 dark:border-gray-800 hidden md:block">
            <h2 className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">Pilih Tanggal</h2>
          </div>
          
          <div className="flex-1 flex flex-row md:flex-col overflow-x-auto md:overflow-x-hidden md:overflow-y-auto p-2 md:p-3 gap-2 md:space-y-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
            {isLoading ? (
              <p className="text-gray-500 text-sm p-4 whitespace-nowrap">Memuat tanggal...</p>
            ) : dateList.length === 0 ? (
              <p className="text-gray-500 text-sm p-4 whitespace-nowrap">Belum ada riwayat.</p>
            ) : (
              dateList.map((date) => {
                const isActive = selectedDate === date;
                const txCount = groupedOrders[date].length;
                
                return (
                  <button
                    key={date}
                    onClick={() => setSelectedDate(date)}
                    className={`shrink-0 md:shrink w-48 md:w-full text-left px-4 py-3 md:py-4 rounded-xl flex items-center justify-between transition-all ${
                      isActive 
                        ? 'bg-yellow-50 dark:bg-yellow-500/10 border-2 border-yellow-500 text-yellow-700 dark:text-yellow-500' 
                        : 'bg-white dark:bg-gray-800 border-2 border-transparent hover:border-gray-200 dark:hover:border-gray-700 text-gray-700 dark:text-gray-300 shadow-sm'
                    }`}
                  >
                    <div>
                      <div className="font-bold mb-1 flex items-center gap-2 text-sm md:text-base">
                        <Calendar className="w-4 h-4" /> {date}
                      </div>
                      <div className={`text-xs font-semibold ${isActive ? 'text-yellow-600 dark:text-yellow-500/80' : 'text-gray-500'}`}>
                        {txCount} Transaksi
                      </div>
                    </div>
                    <ChevronRight className={`w-5 h-5 hidden md:block ${isActive ? 'opacity-100' : 'opacity-0'}`} />
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* --- MAIN CONTENT (DETAIL TRANSAKSI) --- */}
        <div className="flex-1 bg-white dark:bg-kanovi-darker flex flex-col overflow-hidden">
          
          <div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
            <h2 className="text-lg md:text-xl font-bold text-kanovi-coffee dark:text-white">
              Transaksi: <span className="text-yellow-600 dark:text-yellow-500">{selectedDate || '...'}</span>
            </h2>
            {selectedDate && (
              <span className="px-3 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-lg text-xs md:text-sm font-bold shadow-sm">
                Total: {groupedOrders[selectedDate]?.length || 0} Order
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
            {!selectedDate ? (
              <div className="h-full flex items-center justify-center text-gray-500">
                Pilih tanggal untuk melihat riwayat.
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 auto-rows-max">
                {groupedOrders[selectedDate]?.map((order) => (
                  <div key={order.id} className="bg-kanovi-bone dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 md:p-5 hover:shadow-md transition">
                    
                    <div className="flex justify-between items-start mb-4 border-b border-gray-200 dark:border-gray-700 pb-4">
                      <div className="flex items-center gap-3 md:gap-4">
                        <div className="bg-white dark:bg-gray-900 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-center shadow-sm">
                          <p className="text-[10px] text-gray-500 uppercase font-bold">No</p>
                          <p className="text-lg md:text-xl font-black text-kanovi-coffee dark:text-white">#{order.dailyNo}</p>
                        </div>
                        <div>
                          <h3 className="font-bold text-base md:text-lg text-gray-800 dark:text-gray-200">
                            {order.customerName || "Pelanggan Counter"}
                          </h3>
                          <p className="text-xs text-gray-500 mt-1 font-mono">
                            Jam: {new Date(order.orderedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      
                      <span className={`px-2 py-1 md:px-3 md:py-1 rounded-lg text-[10px] md:text-xs font-bold uppercase ${
                        order.status === 'DONE' ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400 border border-green-200 dark:border-green-500/20' : 
                        order.status === 'READY' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20' :
                        'bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400 border border-orange-200 dark:border-orange-500/20'
                      }`}>
                        {order.status}
                      </span>
                    </div>

                    <ul className="space-y-2 mb-4">
                      {order.details.map((item) => (
                        <li key={item.id} className="flex items-center text-gray-700 dark:text-gray-300 text-sm">
                          <span className="w-8 font-black text-kanovi-coffee dark:text-gray-400">{item.qty}x</span> 
                          <span className="font-medium">{item.menu.name}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                      <span className="text-xs text-gray-400 dark:text-gray-500">ID DB: {order.id}</span>
                      <span className="font-black text-green-600 dark:text-green-400 text-base md:text-lg">
                        Rp {order.totalPrice.toLocaleString('id-ID')}
                      </span>
                    </div>
                    
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
}