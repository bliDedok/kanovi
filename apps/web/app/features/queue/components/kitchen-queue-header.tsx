"use client";

import { ArrowLeft, Coffee, Moon, Sun } from "lucide-react";

type Props = {
  currentTime: Date;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onBack: () => void;
};

export default function KitchenQueueHeader({
  currentTime,
  isDarkMode,
  onToggleTheme,
  onBack,
}: Props) {
  return (
    <div className="flex justify-between items-center mb-6 bg-kanovi-bone dark:bg-[#1a1a1a] p-4 rounded-2xl shadow-sm border border-kanovi-cream/50 dark:border-white/5">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-3 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition text-kanovi-coffee dark:text-gray-200 border border-kanovi-cream/50 dark:border-transparent"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <h1 className="text-xl md:text-3xl font-bold flex items-center gap-3 text-kanovi-coffee dark:text-white">
          <Coffee className="w-7 h-7 md:w-8 md:h-8 text-yellow-600 dark:text-yellow-500" />
          <span className="hidden sm:inline">KANOVI KITCHEN DISPLAY</span>
          <span className="sm:hidden">KITCHEN</span>
        </h1>
      </div>

      <div className="flex items-center gap-3 md:gap-4">
        <div className="bg-white dark:bg-gray-800 px-4 py-2.5 rounded-xl shadow-sm border border-kanovi-cream/50 dark:border-transparent font-mono text-base md:text-lg text-kanovi-coffee dark:text-gray-200 font-bold">
          {currentTime.toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>

        <button
          onClick={onToggleTheme}
          className="p-3 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition text-kanovi-coffee dark:text-yellow-400 border border-kanovi-cream/50 dark:border-transparent"
        >
          {isDarkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
        </button>
      </div>
    </div>
  );
}