"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = () => {
    // Cara menghapus cookies adalah dengan mengatur tanggal kadaluarsanya ke masa lalu
    document.cookie = "kanovi_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "kanovi_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    
    // Arahkan kembali ke login
    router.push("/login");
    router.refresh();
  };

  return (
    <button 
      onClick={handleLogout} 
      style={{ padding: '8px 16px', backgroundColor: '#ff4d4d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
    >
      Keluar (Logout)
    </button>
  );
}