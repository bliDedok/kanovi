"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "../components/LogoutButton"; 

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Di HP, defaultnya tertutup
  const [isDarkMode, setIsDarkMode] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (document.documentElement.classList.contains("dark")) setIsDarkMode(true);
    // Jika layar cukup besar (iPad/Desktop), otomatis buka sidebar
    if (window.innerWidth >= 768) setIsSidebarOpen(true);
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
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 font-sans overflow-hidden">
      
      {/* OVERLAY GELAP UNTUK HP (Muncul kalau sidebar dibuka di layar kecil) */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR - Responsive position */}
      <aside className={`fixed md:relative z-50 h-full ${isSidebarOpen ? "w-64 translate-x-0" : "w-64 -translate-x-full md:w-20 md:translate-x-0"} bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 flex flex-col shadow-xl md:shadow-sm`}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
          {/* Logo hanya muncul kalau Sidebar lebar */}
          <span className={`font-bold text-xl text-gray-800 dark:text-white whitespace-nowrap transition-opacity ${!isSidebarOpen && 'md:opacity-0 md:hidden'}`}>Kanovi Escape</span>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
            className="p-2 ml-auto rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition"
          >
            ☰
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <Link href="/dashboard" onClick={() => window.innerWidth < 768 && setIsSidebarOpen(false)} className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${pathname === '/dashboard' ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 font-semibold' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
            <span className="text-xl">📊</span>
            <span className={`${!isSidebarOpen && 'md:hidden'}`}>Beranda</span>
          </Link>
          
          <Link href="/dashboard/menu" onClick={() => window.innerWidth < 768 && setIsSidebarOpen(false)} className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${pathname.includes('/dashboard/menu') ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 font-semibold' : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
            <span className="text-xl">☕</span>
            <span className={`${!isSidebarOpen && 'md:hidden'}`}>Kelola Menu</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex flex-col gap-3">
          <button onClick={toggleTheme} className="flex items-center justify-center gap-2 p-2.5 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition font-medium text-sm">
            {isDarkMode ? "☀️" : "🌙"} <span className={`${!isSidebarOpen && 'md:hidden'}`}>{isDarkMode ? "Terang" : "Gelap"}</span>
          </button>
          <div className={`${!isSidebarOpen && 'md:flex md:justify-center'}`}>
             {isSidebarOpen ? <LogoutButton /> : <div title="Logout"><LogoutButton /></div>}
          </div>
        </div>
      </aside>

      {/* KONTEN UTAMA */}
      <main className="flex-1 h-full overflow-y-auto p-4 md:p-8 text-gray-900 dark:text-gray-100 w-full">
        {/* Tombol menu darurat untuk HP jika sidebar tertutup */}
        {!isSidebarOpen && (
          <button onClick={() => setIsSidebarOpen(true)} className="md:hidden mb-4 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">
            ☰ Menu
          </button>
        )}
        {children}
      </main>

    </div>
  );
}