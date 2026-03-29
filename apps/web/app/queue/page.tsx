"use client";

import { useEffect, useState } from "react";
import { CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import KitchenQueueHeader from "../features/queue/components/kitchen-queue-header";
import KitchenOrderCard from "../features/queue/components/kitchen-order-card";
import { useKitchenQueue } from "../features/queue/hooks/use-kitchen-queue";

export default function KitchenQueuePage() {
  const router = useRouter();
  const { orders, isLoading, updateItemStatus } = useKitchenQueue();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("kanovi_theme");
    if (savedTheme === "dark" || document.documentElement.classList.contains("dark")) {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    }

    const timeInterval = setInterval(() => setCurrentTime(new Date()), 60000);

    return () => clearInterval(timeInterval);
  }, []);

  const toggleTheme = () => {
    const isDark = !isDarkMode;
    setIsDarkMode(isDark);
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("kanovi_theme", isDark ? "dark" : "light");
  };

  return (
    <div className="min-h-screen bg-kanovi-paper dark:bg-kanovi-darker p-4 md:p-6 font-sans transition-colors duration-300">
      <KitchenQueueHeader
        currentTime={currentTime}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
        onBack={() => router.push("/pos")}
      />

      {isLoading ? (
        <p className="text-gray-500 dark:text-gray-400 text-center mt-10">
          Memuat antrian...
        </p>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 bg-kanovi-bone dark:bg-[#1a1a1a] rounded-3xl shadow-sm border border-kanovi-cream/50 dark:border-white/5 mt-10">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6 opacity-80" />
          <h2 className="text-2xl font-bold text-kanovi-coffee dark:text-white">
            Kitchen Bersih!
          </h2>
          <p className="text-kanovi-coffee/70 dark:text-gray-400 mt-2">
            Belum ada item pesanan yang perlu dikerjakan.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
          {orders.map((order) => (
            <KitchenOrderCard
              key={order.id}
              order={order}
              now={currentTime}
              onAdvanceStatus={updateItemStatus}
            />
          ))}
        </div>
      )}
    </div>
  );
}