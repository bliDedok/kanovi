"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "../components/LogoutButton";
import { Toaster } from "react-hot-toast";
import {
  Coffee,
  LayoutDashboard,
  Menu,
  Moon,
  Package,
  Shapes,
  Sun,
  UtensilsCrossed,
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const savedTheme = localStorage.getItem("kanovi_theme");

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
      localStorage.setItem("kanovi_theme", "light");
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("kanovi_theme", "dark");
      setIsDarkMode(true);
    }
  };

  const navItems = [
    {
      label: "Beranda",
      href: "/dashboard",
      icon: LayoutDashboard,
      active: pathname === "/dashboard",
    },
    {
      label: "Kelola Menu",
      href: "/dashboard/menu",
      icon: UtensilsCrossed,
      active: pathname.includes("/dashboard/menu"),
    },
    {
      label: "Kelola Kategori",
      href: "/dashboard/category",
      icon: Shapes,
      active: pathname.includes("/dashboard/category"),
    },
    {
      label: "Kelola Stock",
      href: "/dashboard/inventory",
      icon: Package,
      active: pathname.includes("/dashboard/inventory"),
    },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-[#edf2f4] font-sans text-[#20272c] transition-colors duration-500 dark:bg-[#311B14] dark:text-[#f7efe7]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.95)_0%,rgba(237,242,244,1)_35%,rgba(226,233,236,1)_100%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(92,53,39,0.8)_0%,rgba(49,27,20,1)_45%,rgba(27,13,9,1)_100%)]" />

      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/35 backdrop-blur-sm md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed md:relative z-50 h-full shrink-0 transition-all duration-300 ${
          isSidebarOpen
            ? "w-64 translate-x-0"
            : "w-64 -translate-x-full md:w-20 md:translate-x-0"
        }`}
      >
        <div className="h-full p-4">
          <div className="flex h-full flex-col rounded-[2rem] border border-white/70 bg-[#edf2f4]/85 shadow-[18px_18px_42px_rgba(130,145,152,0.22),-14px_-14px_34px_rgba(255,255,255,0.92)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.055] dark:shadow-[18px_18px_42px_rgba(0,0,0,0.34),-8px_-8px_24px_rgba(255,255,255,0.035)]">
            <div className="flex h-20 items-center justify-between px-4">
              <Link
                href="/dashboard"
                className={`flex items-center gap-3 overflow-hidden transition-opacity ${
                  !isSidebarOpen && "md:justify-center"
                }`}
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#edf2f4] text-[#2b65d9] shadow-[7px_7px_16px_rgba(130,145,152,0.2),-7px_-7px_16px_rgba(255,255,255,0.95)] dark:bg-white/[0.07] dark:text-[#FFD28A] dark:shadow-[7px_7px_16px_rgba(0,0,0,0.28),-5px_-5px_14px_rgba(255,255,255,0.035)]">
                  <Coffee className="h-5 w-5" strokeWidth={2} />
                </div>

                <div
                  className={`min-w-0 transition-all ${
                    !isSidebarOpen && "md:hidden"
                  }`}
                >
                  <p className="truncate text-lg font-black tracking-tight">
                    Kanovi
                  </p>

                </div>
              </Link>

              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#edf2f4] text-[#20272c] shadow-[7px_7px_16px_rgba(130,145,152,0.2),-7px_-7px_16px_rgba(255,255,255,0.95)] transition-all active:shadow-[inset_5px_5px_10px_rgba(130,145,152,0.22),inset_-5px_-5px_10px_rgba(255,255,255,0.95)] dark:bg-white/[0.07] dark:text-white dark:shadow-[7px_7px_16px_rgba(0,0,0,0.28),-5px_-5px_14px_rgba(255,255,255,0.035)] dark:active:shadow-[inset_5px_5px_10px_rgba(0,0,0,0.28),inset_-5px_-5px_10px_rgba(255,255,255,0.035)]"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
              <p
                className={`px-3 text-[11px] font-black uppercase tracking-[0.22em] text-[#8a969c] dark:text-white/35 ${
                  !isSidebarOpen && "md:hidden"
                }`}
              >
                
              </p>

              {navItems.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() =>
                      window.innerWidth < 768 && setIsSidebarOpen(false)
                    }
                    className={`group flex items-center gap-4 rounded-2xl px-3 py-3 text-sm font-bold transition-all duration-300 ${
                      item.active
                        ? "bg-[#edf2f4] text-[#2b65d9] shadow-[inset_6px_6px_12px_rgba(130,145,152,0.22),inset_-6px_-6px_12px_rgba(255,255,255,0.95)] dark:bg-white/[0.075] dark:text-[#FFD28A] dark:shadow-[inset_6px_6px_12px_rgba(0,0,0,0.28),inset_-6px_-6px_12px_rgba(255,255,255,0.035)]"
                        : "text-[#6f7a80] hover:bg-[#edf2f4] hover:text-[#20272c] hover:shadow-[7px_7px_16px_rgba(130,145,152,0.16),-7px_-7px_16px_rgba(255,255,255,0.9)] dark:text-white/55 dark:hover:bg-white/[0.055] dark:hover:text-white dark:hover:shadow-[7px_7px_16px_rgba(0,0,0,0.22),-4px_-4px_12px_rgba(255,255,255,0.03)]"
                    } ${!isSidebarOpen && "md:justify-center"}`}
                  >
                    <Icon className="h-5 w-5 shrink-0" strokeWidth={2} />
                    <span
                      className={`truncate transition-all ${
                        !isSidebarOpen && "md:hidden"
                      }`}
                    >
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </nav>

            <div className="space-y-3 p-4">
              <button
                onClick={toggleTheme}
                className={`flex w-full items-center gap-3 rounded-2xl bg-[#edf2f4] px-3 py-3 text-sm font-bold text-[#20272c] shadow-[7px_7px_16px_rgba(130,145,152,0.18),-7px_-7px_16px_rgba(255,255,255,0.92)] transition-all active:shadow-[inset_5px_5px_10px_rgba(130,145,152,0.22),inset_-5px_-5px_10px_rgba(255,255,255,0.95)] dark:bg-white/[0.07] dark:text-white dark:shadow-[7px_7px_16px_rgba(0,0,0,0.28),-5px_-5px_14px_rgba(255,255,255,0.035)] dark:active:shadow-[inset_5px_5px_10px_rgba(0,0,0,0.28),inset_-5px_-5px_10px_rgba(255,255,255,0.035)] ${
                  !isSidebarOpen && "md:justify-center"
                }`}
              >
                {isDarkMode ? (
                  <Sun className="h-5 w-5 shrink-0 text-[#FFD28A]" />
                ) : (
                  <Moon className="h-5 w-5 shrink-0" />
                )}
                <span className={`${!isSidebarOpen && "md:hidden"}`}>
                  {isDarkMode ? "Terang" : "Gelap"}
                </span>
              </button>

              <div className={`${!isSidebarOpen && "md:overflow-hidden"}`}>
                <LogoutButton />
              </div>
            </div>
          </div>
        </div>
      </aside>

      <main className="relative z-10 h-full flex-1 overflow-y-auto p-4 text-[#20272c] dark:text-[#f7efe7] md:p-8">
        {!isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="mb-4 flex items-center gap-2 rounded-2xl bg-[#edf2f4] px-4 py-3 text-sm font-bold text-[#20272c] shadow-[8px_8px_18px_rgba(130,145,152,0.2),-8px_-8px_18px_rgba(255,255,255,0.92)] active:shadow-[inset_5px_5px_10px_rgba(130,145,152,0.22),inset_-5px_-5px_10px_rgba(255,255,255,0.95)] dark:bg-white/[0.07] dark:text-white dark:shadow-[8px_8px_18px_rgba(0,0,0,0.28),-5px_-5px_14px_rgba(255,255,255,0.035)] md:hidden"
          >
            <Menu className="h-5 w-5" />
            Menu
          </button>
        )}

        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: isDarkMode ? "#2C1812" : "#EDF2F4",
              color: isDarkMode ? "#F9F6F0" : "#20272C",
              border: isDarkMode
                ? "1px solid rgba(255,255,255,0.10)"
                : "1px solid rgba(255,255,255,0.75)",
              boxShadow: isDarkMode
                ? "10px 10px 24px rgba(0,0,0,0.35)"
                : "10px 10px 24px rgba(130,145,152,0.18), -8px -8px 20px rgba(255,255,255,0.9)",
              borderRadius: "18px",
            },
          }}
        />

        {children}
      </main>
    </div>
  );
}