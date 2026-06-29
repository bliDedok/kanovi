"use client";

import {
  X,
  MonitorPlay,
  History,
  LogOut,
  Printer,
  Receipt,
  Calculator,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { printTestReceipt } from "../../lib/printer";

type BurgerMenuProps = {
  isOpen: boolean;
  onClose: () => void;
  onOpenExpense?: () => void;
  onOpenClosing?: () => void;
};

export default function BurgerMenu({
  isOpen,
  onClose,
  onOpenExpense,
  onOpenClosing,
}: BurgerMenuProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const handleLogout = () => {
    localStorage.removeItem("kanovi_branch");
    document.cookie = "kanovi_token=; path=/; max-age=0;";
    document.cookie = "kanovi_role=; path=/; max-age=0;";
    router.push("/login");
  };

  const handleTestPrint = () => {
    try {
      printTestReceipt();
      onClose();
    } catch (error: any) {
      alert(error?.message || "Gagal menjalankan test print.");
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-72 bg-kanovi-paper/95 dark:bg-kanovi-darker/95 backdrop-blur-md h-full shadow-2xl flex flex-col border-r border-kanovi-cream/30 dark:border-white/5 animate-in slide-in-from-left duration-300">
        <div className="p-6 border-b border-kanovi-cream/30 dark:border-white/5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-kanovi-coffee dark:text-kanovi-bone">
              Menu Navigasi
            </h2>
            <p className="text-xs text-kanovi-coffee/60 dark:text-kanovi-cream/60">
              POS Kanovi
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 bg-kanovi-bone dark:bg-white/5 hover:bg-kanovi-cream dark:hover:bg-white/10 rounded-full transition-colors text-kanovi-coffee dark:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-2 flex-1">
          <button
            onClick={() => router.push("/queue")}
            className="w-full flex items-center gap-3 px-4 py-4 rounded-xl hover:bg-yellow-500/10 text-kanovi-coffee dark:text-kanovi-bone hover:text-yellow-600 dark:hover:text-yellow-500 font-semibold transition-colors group"
          >
            <MonitorPlay className="w-5 h-5 text-kanovi-wood dark:text-kanovi-cream group-hover:text-yellow-500 transition-colors" />
            Layar Antrian
          </button>

          <button
            onClick={() => router.push("/history")}
            className="w-full flex items-center gap-3 px-4 py-4 rounded-xl hover:bg-kanovi-bone dark:hover:bg-white/5 text-kanovi-coffee dark:text-kanovi-bone font-semibold transition-colors group"
          >
            <History className="w-5 h-5 text-kanovi-wood dark:text-kanovi-cream group-hover:text-yellow-500 transition-colors" />
            Riwayat Transaksi
          </button>

          <button
            onClick={handleTestPrint}
            className="w-full flex items-center gap-3 px-4 py-4 rounded-xl hover:bg-kanovi-bone dark:hover:bg-white/5 text-kanovi-coffee dark:text-kanovi-bone font-semibold transition-colors group"
          >
            <Printer className="w-5 h-5 text-kanovi-wood dark:text-kanovi-cream group-hover:text-yellow-500 transition-colors" />
            Test Print
          </button>

          <button
            onClick={() => {
              onClose();
              onOpenExpense?.();
            }}
            className="w-full flex items-center gap-3 px-4 py-4 rounded-xl hover:bg-red-500/10 text-kanovi-coffee dark:text-kanovi-bone hover:text-red-600 font-semibold transition-colors group"
          >
            <Receipt className="w-5 h-5 text-red-500" />
            Catat Pengeluaran
          </button>

          <button
            onClick={() => {
              onClose();
              onOpenClosing?.();
            }}
            className="w-full flex items-center gap-3 px-4 py-4 rounded-xl hover:bg-orange-500/10 text-kanovi-coffee dark:text-kanovi-bone hover:text-orange-600 font-semibold transition-colors group"
          >
            <Calculator className="w-5 h-5 text-orange-500" />
            Tutup Kasir (Closing)
          </button>
        </div>

        <div className="p-4 border-t border-kanovi-cream/30 dark:border-white/5">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-4 rounded-xl bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 font-bold transition-colors border border-transparent hover:border-red-200 dark:hover:border-red-500/30"
          >
            <LogOut className="w-5 h-5" />
            Keluar
          </button>
        </div>
      </div>
    </div>
  );
}