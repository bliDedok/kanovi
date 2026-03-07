"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
// PERBAIKAN ALAMAT IMPORT DI SINI 👇
import LogoutButton from "../components/LogoutButton"; 

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (document.documentElement.classList.contains("dark")) {
      setIsDarkMode(true);
    }
  }, []);

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove("dark");
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add("dark");
      setIsDarkMode(true);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 font-sans">
      
      {/* SIDEBAR */}
      <aside className={`${isSidebarOpen ? "w-64" : "w-20"} bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 flex flex-col shadow-sm`}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
          {isSidebarOpen && <span className="font-bold text-xl text-gray-800 dark:text-white whitespace-nowrap">Kanovi Escape</span>}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition"
          >
            ☰
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <Link href="/dashboard" className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${pathname === '/dashboard' ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 font-semibold' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
            <span className="text-xl">📊</span>
            {isSidebarOpen && <span>Beranda</span>}
          </Link>
          
          <Link href="/dashboard/menu" className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${pathname.includes('/dashboard/menu') ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 font-semibold' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
            <span className="text-xl">☕</span>
            {isSidebarOpen && <span>Kelola Menu</span>}
          </Link>

          <div className="flex items-center gap-4 p-3 rounded-lg text-gray-400 dark:text-gray-500 cursor-not-allowed">
            <span className="text-xl">📦</span>
            {isSidebarOpen && <span>Kelola Bahan</span>}
          </div>
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex flex-col gap-3">
          <button 
            onClick={toggleTheme} 
            className="flex items-center justify-center gap-2 p-2.5 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition font-medium"
          >
            {isDarkMode ? "☀️" : "🌙"} {isSidebarOpen && (isDarkMode ? "Terang" : "Gelap")}
          </button>
          
          {isSidebarOpen ? <LogoutButton /> : <div title="Logout" className="flex justify-center"><LogoutButton /></div>}
        </div>
      </aside>

      {/* KONTEN UTAMA */}
      <main className="flex-1 overflow-y-auto p-8 text-gray-900 dark:text-gray-100">
        {children}
      </main>

    </div>
  );
}