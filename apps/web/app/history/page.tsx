"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Calendar, Receipt, ChevronRight, Sun, Moon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Order } from "../../types";
import { api } from "../../lib/api";
import HistoryCard from "../components/HistoryCard";

export default function HistoryPage() {
  const router = useRouter();
  const [groupedOrders, setGroupedOrders] = useState<Record<string, (Order & { dailyNo: number })[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // --- 1. EKSTRAK FUNGSI FETCH AGAR BISA DIPANGGIL ULANG ---
  const fetchHistory = useCallback(async () => {
    try {
      const json = await api.getHistory();
      const orders: Order[] = json.data || [];
      const groups: Record<string, (Order & { dailyNo: number })[]> = {};
      
      orders.forEach((order) => {
        const dateStr = new Date(order.orderedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        if (!groups[dateStr]) groups[dateStr] = [];
        groups[dateStr].push({ ...order, dailyNo: groups[dateStr].length + 1 });
      });

      for (const date in groups) groups[date].reverse(); 

      setGroupedOrders(groups);
      const availableDates = Object.keys(groups).reverse();
      
      // Jangan timpa selectedDate kalau sudah ada (supaya saat refresh data tidak pindah tab)
      setSelectedDate(prev => {
        if (prev && availableDates.includes(prev)) return prev;
        return availableDates.length > 0 ? availableDates[0] : null;
      });
    } catch (error) {
      console.error("Gagal mengambil history", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem("kanovi_theme");
    if (savedTheme === "dark" || document.documentElement.classList.contains("dark")) {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    }

    fetchHistory();
  }, [fetchHistory]);

  const toggleTheme = () => {
    const isDark = !isDarkMode;
    setIsDarkMode(isDark);
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("kanovi_theme", isDark ? "dark" : "light");
  };

  // --- 2. FUNGSI HANDLE VOID ORDER ---
  const handleVoidOrder = async (orderId: number) => {
    const pin = prompt("🔒 Otorisasi Manager\nMasukkan 6 Digit PIN untuk membatalkan transaksi ini:");
    
    if (!pin) return; // Batal jika input kosong atau di-cancel

    try {
      await api.voidOrder(orderId, pin);
      alert("✅ Transaksi berhasil di-VOID. Stok bahan baku telah dikembalikan.");
      fetchHistory(); // Panggil ulang data agar UI otomatis ter-update!
    } catch (err: any) {
      alert("❌ Gagal VOID: " + err.message);
    }
  };

  const dateList = Object.keys(groupedOrders).reverse();

  return (
    <div className="h-screen flex flex-col bg-kanovi-paper dark:bg-kanovi-darker font-sans transition-colors duration-300 overflow-hidden">
      
      {/* --- HEADER --- */}
      <div className="shrink-0 bg-white dark:bg-gray-900 px-4 md:px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/pos')} className="p-2 md:p-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-xl transition text-kanovi-coffee dark:text-gray-200">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2 md:gap-3 text-kanovi-coffee dark:text-white">
            <Receipt className="w-6 h-6 md:w-7 md:h-7 text-yellow-500" /> Riwayat Transaksi
          </h1>
        </div>
        <button onClick={toggleTheme} className="p-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition text-kanovi-coffee dark:text-yellow-400 focus:outline-none">
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>

      {/* --- MAIN LAYOUT RESPONSIVE --- */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* --- SIDEBAR TANGGAL --- */}
        <div className="w-full md:w-1/3 lg:w-1/4 max-w-sm border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1a1a1a] flex flex-col z-0">
          <div className="p-4 border-b border-gray-200 dark:border-gray-800 hidden md:block">
            <h2 className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">Pilih Tanggal</h2>
          </div>
          <div className="flex-1 flex flex-row md:flex-col overflow-x-auto md:overflow-x-hidden md:overflow-y-auto p-2 md:p-3 gap-2 md:space-y-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
            {isLoading ? ( <p className="text-gray-500 text-sm p-4 whitespace-nowrap">Memuat tanggal...</p> ) : dateList.length === 0 ? ( <p className="text-gray-500 text-sm p-4 whitespace-nowrap">Belum ada riwayat.</p> ) : (
              dateList.map((date) => {
                const isActive = selectedDate === date;
                return (
                  <button key={date} onClick={() => setSelectedDate(date)} className={`shrink-0 md:shrink w-48 md:w-full text-left px-4 py-3 md:py-4 rounded-xl flex items-center justify-between transition-all ${isActive ? 'bg-yellow-50 dark:bg-yellow-500/10 border-2 border-yellow-500 text-yellow-700 dark:text-yellow-500' : 'bg-white dark:bg-gray-800 border-2 border-transparent hover:border-gray-200 dark:hover:border-gray-700 text-gray-700 dark:text-gray-300 shadow-sm'}`}>
                    <div>
                      <div className="font-bold mb-1 flex items-center gap-2 text-sm md:text-base"><Calendar className="w-4 h-4" /> {date}</div>
                      <div className={`text-xs font-semibold ${isActive ? 'text-yellow-600 dark:text-yellow-500/80' : 'text-gray-500'}`}>{groupedOrders[date].length} Transaksi</div>
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
            <h2 className="text-lg md:text-xl font-bold text-kanovi-coffee dark:text-white">Transaksi: <span className="text-yellow-600 dark:text-yellow-500">{selectedDate || '...'}</span></h2>
            {selectedDate && <span className="px-3 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-lg text-xs md:text-sm font-bold shadow-sm">Total: {groupedOrders[selectedDate]?.length || 0} Order</span>}
          </div>

          <div className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
            {!selectedDate ? ( <div className="h-full flex items-center justify-center text-gray-500">Pilih tanggal untuk melihat riwayat.</div> ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 auto-rows-max">
                
                {/* 3. MENGIRIM PROP onVoid KE DALAM KARTU */}
                {groupedOrders[selectedDate]?.map((order) => (
                  <HistoryCard 
                    key={order.id} 
                    order={order} 
                    onVoid={handleVoidOrder} // 
                  />
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}