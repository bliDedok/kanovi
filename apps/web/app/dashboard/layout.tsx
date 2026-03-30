"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "../components/LogoutButton";
import { Toaster } from "react-hot-toast";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // 1. Cek ingatan browser saat halaman pertama kali dibuka
    const savedTheme = localStorage.getItem("kanovi_theme");

    // 2. Kalau ingatannya bilang "dark", langsung pakai dark mode!
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
      setIsDarkMode(true);
    } else {
      document.documentElement.classList.remove("dark");
      setIsDarkMode(false);
    }

    if (window.innerWidth >= 768) setIsSidebarOpen(true);
  }, []);

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("kanovi_theme", "light"); // Simpan ke memori
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("kanovi_theme", "dark"); // Simpan ke memori
      setIsDarkMode(true);
    }
  };

  return (
    <div className="flex h-screen bg-kanovi-bone dark:bg-kanovi-dark transition-colors duration-300 font-sans overflow-hidden">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed md:relative z-50 h-full ${
          isSidebarOpen
            ? "w-64 translate-x-0"
            : "w-64 -translate-x-full md:w-20 md:translate-x-0"
        } bg-white dark:bg-kanovi-darker border-r border-kanovi-cream/50 dark:border-white/5 transition-all duration-300 flex flex-col shadow-xl md:shadow-sm`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-kanovi-cream/50 dark:border-white/5">
          <span
            className={`font-bold text-xl text-kanovi-coffee dark:text-kanovi-bone whitespace-nowrap transition-opacity ${
              !isSidebarOpen && "md:opacity-0 md:hidden"
            }`}
          >
            Kanovi ☕
          </span>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 ml-auto rounded-lg hover:bg-kanovi-cream/30 dark:hover:bg-white/10 text-kanovi-coffee dark:text-kanovi-cream transition"
          >
            ☰
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <Link
            href="/dashboard"
            onClick={() => window.innerWidth < 768 && setIsSidebarOpen(false)}
            className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${
              pathname === "/dashboard"
                ? "bg-kanovi-cream/50 dark:bg-kanovi-wood/20 text-kanovi-wood dark:text-kanovi-wood font-semibold"
                : "hover:bg-kanovi-cream/30 dark:hover:bg-white/5 text-gray-600 dark:text-gray-300"
            }`}
          >
            <span className="text-xl">📊</span>
            <span className={`${!isSidebarOpen && "md:hidden"}`}>Beranda</span>
          </Link>

          <Link
            href="/dashboard/menu"
            onClick={() => window.innerWidth < 768 && setIsSidebarOpen(false)}
            className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${
              pathname.includes("/dashboard/menu")
                ? "bg-kanovi-cream/50 dark:bg-kanovi-wood/20 text-kanovi-wood dark:text-kanovi-wood font-semibold"
                : "hover:bg-kanovi-cream/30 dark:hover:bg-white/5 text-gray-600 dark:text-gray-300"
            }`}
          >
            <span className="text-xl">☕</span>
            <span className={`${!isSidebarOpen && "md:hidden"}`}>Kelola Menu</span>
          </Link>

          <Link
            href="/dashboard/recipe"
            onClick={() => window.innerWidth < 768 && setIsSidebarOpen(false)}
            className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${
              pathname.includes("/dashboard/recipe")
                ? "bg-kanovi-cream/50 dark:bg-kanovi-wood/20 text-kanovi-wood dark:text-kanovi-wood font-semibold"
                : "hover:bg-kanovi-cream/30 dark:hover:bg-white/5 text-gray-600 dark:text-gray-300"
            }`}
          >
            <span className="text-xl">📖</span>
            <span className={`${!isSidebarOpen && "md:hidden"}`}>Kelola Recipe</span>
          </Link>

          <Link
            href="/dashboard/category"
            onClick={() => window.innerWidth < 768 && setIsSidebarOpen(false)}
            className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${
              pathname.includes("/dashboard/category")
                ? "bg-kanovi-cream/50 dark:bg-kanovi-wood/20 text-kanovi-wood dark:text-kanovi-wood font-semibold"
                : "hover:bg-kanovi-cream/30 dark:hover:bg-white/5 text-gray-600 dark:text-gray-300"
            }`}
          >
            <span className="text-xl">📊</span>
            <span className={`${!isSidebarOpen && "md:hidden"}`}>Kelola Kategori</span>
          </Link>

          <Link
            href="/dashboard/inventory"
            onClick={() => window.innerWidth < 768 && setIsSidebarOpen(false)}
            className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${
              pathname.includes("/dashboard/inventory")
                ? "bg-kanovi-cream/50 dark:bg-kanovi-wood/20 text-kanovi-wood dark:text-kanovi-wood font-semibold"
                : "hover:bg-kanovi-cream/30 dark:hover:bg-white/5 text-gray-600 dark:text-gray-300"
            }`}
          >
            <span className="text-xl">📦</span>
            <span className={`${!isSidebarOpen && "md:hidden"}`}>Kelola Stock</span>
          </Link>

          <Link
            href="/dashboard/finance"
            onClick={() => window.innerWidth < 768 && setIsSidebarOpen(false)}
            className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${
              pathname.includes("/dashboard/inventory")
                ? "bg-kanovi-cream/50 dark:bg-kanovi-wood/20 text-kanovi-wood dark:text-kanovi-wood font-semibold"
                : "hover:bg-kanovi-cream/30 dark:hover:bg-white/5 text-gray-600 dark:text-gray-300"
            }`}
          >
            <span className="text-xl">📈</span>
            <span className={`${!isSidebarOpen && "md:hidden"}`}>Kelola Keuangan</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-kanovi-cream/50 dark:border-white/5 flex flex-col gap-3">
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center gap-2 p-2.5 bg-kanovi-cream/30 dark:bg-white/5 rounded-lg text-kanovi-coffee dark:text-kanovi-cream hover:bg-kanovi-cream/60 dark:hover:bg-white/10 transition font-medium text-sm border border-kanovi-wood/10 dark:border-white/5"
          >
            {isDarkMode ? "☀️" : "🌙"}{" "}
            <span className={`${!isSidebarOpen && "md:hidden"}`}>
              {isDarkMode ? "Terang" : "Gelap"}
            </span>
          </button>
          <div className={`${!isSidebarOpen && "md:flex md:justify-center"}`}>
            {isSidebarOpen ? <LogoutButton /> : <div title="Logout"><LogoutButton /></div>}
          </div>
        </div>
      </aside>

      <main className="flex-1 h-full overflow-y-auto p-4 md:p-8 text-kanovi-coffee dark:text-kanovi-bone w-full">
        {!isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden mb-4 p-2 bg-white dark:bg-kanovi-darker rounded-lg shadow-sm border border-kanovi-cream/50 dark:border-white/5 text-kanovi-coffee dark:text-kanovi-cream"
          >
            ☰ Menu
          </button>
        )}

        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: isDarkMode ? "#2C231F" : "#F9F6F0",
              color: isDarkMode ? "#F9F6F0" : "#5C3D2E",
              border: "1px solid #A97142",
            },
          }}
        />

        {children}
      </main>
    </div>
  );
}