"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = () => {
    document.cookie = "kanovi_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "kanovi_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push("/login");
    router.refresh();
  };

  return (
    <button 
      onClick={handleLogout} 
      className="w-full py-2.5 px-4 bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/30 dark:hover:bg-red-900/60 dark:text-red-400 font-semibold rounded-lg transition-colors flex justify-center items-center gap-2"
    >
      <span>🚪</span> Keluar
    </button>
  );
}