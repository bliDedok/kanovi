"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const USERS = [
  { username: "novi", name: "Kak Novi", role: "Owner", icon: "👩‍💼" },
  { username: "dimas", name: "Kak Dimas", role: "Owner", icon: "👨‍💼" },
  { username: "diah", name: "Kak Diah", role: "Kasir", icon: "👩‍🍳" },
  { username: "reza", name: "Kak Reza", role: "Kasir", icon: "👨‍🍳" },
];

export default function LoginPage() {
  const [selectedUser, setSelectedUser] = useState<{ username: string, name: string, role: string, icon: string } | null>(null);
  const [pin, setPin] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false); // STATE TEMA UNTUK LOGIN
  const router = useRouter();

  // BACA MEMORI TEMA SAAT LOGIN DIBUKA
  useEffect(() => {
    const savedTheme = localStorage.getItem("kanovi_theme");
    if (savedTheme === "dark" || document.documentElement.classList.contains("dark")) {
      setIsDarkMode(true);
    }
  }, []);

  // FUNGSI GANTI TEMA DI HALAMAN LOGIN
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

  const handleNumberClick = (num: string) => {
    if (pin.length < 6) { 
      const newPin = pin + num;
      setPin(newPin);
      setErrorMsg("");
      if (newPin.length === 6) submitLogin(selectedUser!.username, newPin);
    }
  };

  const handleDelete = () => setPin(pin.slice(0, -1));

  const submitLogin = async (username: string, passwordPin: string) => {
    setIsLoading(true);
    try {
      const res = await fetch("http://localhost:3001/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password: passwordPin }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg("PIN Salah!");
        setPin(""); 
        setIsLoading(false);
        return;
      }
      document.cookie = `kanovi_token=${data.token}; path=/; max-age=86400;`;
      document.cookie = `kanovi_role=${data.role}; path=/; max-age=86400;`;
      router.push(data.role === 'OWNER' ? "/dashboard" : "/pos");
      router.refresh();
    } catch {
      setErrorMsg("Server error.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-kanovi-bone dark:bg-kanovi-dark flex items-center justify-center p-4 sm:p-8 font-sans transition-colors duration-300 relative">
      
      {/* TOMBOL GANTI TEMA MELAYANG DI POJOK KANAN ATAS */}
      <button 
        onClick={toggleTheme}
        className="absolute top-6 right-6 sm:top-8 sm:right-8 p-3.5 bg-kanovi-paper dark:bg-kanovi-darker border border-kanovi-cream/50 dark:border-white/5 rounded-full shadow-lg text-kanovi-coffee dark:text-kanovi-cream hover:scale-110 hover:shadow-xl transition-all"
        title="Ganti Tema"
      >
        <span className="text-xl">{isDarkMode ? "☀️" : "🌙"}</span>
      </button>

      <div className="w-full max-w-md bg-kanovi-paper dark:bg-kanovi-darker p-6 sm:p-8 rounded-3xl shadow-2xl border border-kanovi-cream/50 dark:border-white/5">
        <div className="text-center mb-6 sm:mb-8">
          <div className="bg-kanovi-wood text-white w-14 h-14 sm:w-16 sm:h-16 rounded-2xl mx-auto flex items-center justify-center mb-4 text-2xl sm:text-3xl shadow-lg">☕</div>
          <h1 className="text-2xl sm:text-3xl font-bold text-kanovi-coffee dark:text-kanovi-bone">Kanovi POS</h1>
          <p className="text-sm sm:text-base text-kanovi-coffee/70 dark:text-kanovi-cream/70 mt-2">{selectedUser ? "Masukkan 6 Digit PIN Anda" : "Siapa yang sedang bertugas?"}</p>
        </div>

        {errorMsg && <div className="bg-kanovi-danger/10 dark:bg-kanovi-danger/20 text-kanovi-danger dark:text-red-400 p-3 rounded-lg text-center mb-6 border border-kanovi-danger/20 animate-pulse text-sm sm:text-base">{errorMsg}</div>}

        {!selectedUser && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 animate-fade-in">
            {USERS.map((u) => (
              <button key={u.username} onClick={() => setSelectedUser(u)} className="bg-kanovi-cream/30 dark:bg-white/5 hover:bg-kanovi-cream/60 dark:hover:bg-white/10 p-3 sm:p-4 rounded-2xl flex flex-row sm:flex-col items-center sm:justify-center gap-3 sm:gap-2 transition-all hover:scale-105 hover:shadow-md text-left sm:text-center border border-transparent hover:border-kanovi-wood/30">
                <span className="text-3xl sm:text-4xl">{u.icon}</span>
                <div className="flex flex-col sm:items-center">
                  <span className="font-bold text-sm sm:text-base text-kanovi-coffee dark:text-kanovi-bone">{u.name}</span>
                  <span className="text-xs text-kanovi-coffee/80 dark:text-kanovi-cream/80 bg-kanovi-cream/50 dark:bg-white/10 px-2.5 py-1 rounded-full w-fit mt-1">{u.role}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {selectedUser && (
          <div className="animate-fade-in">
            <div className="flex flex-col sm:flex-row items-center justify-between mb-6 sm:mb-8 bg-kanovi-cream/30 dark:bg-white/5 p-3 rounded-xl gap-3 sm:gap-0 border border-kanovi-cream/50 dark:border-white/5">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{selectedUser.icon}</span>
                <span className="font-bold text-kanovi-coffee dark:text-kanovi-bone">{selectedUser.name}</span>
              </div>
              <button onClick={() => { setSelectedUser(null); setPin(""); setErrorMsg(""); }} className="text-xs sm:text-sm bg-white dark:bg-white/10 hover:bg-kanovi-wood hover:text-white dark:hover:bg-white/20 text-kanovi-coffee dark:text-kanovi-cream px-3 py-1.5 rounded-lg w-full sm:w-auto transition shadow-sm">Ganti Akun</button>
            </div>

            <div className="flex justify-center gap-2 sm:gap-3 mb-6 sm:mb-8">
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <div key={index} className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full transition-all duration-300 ${index < pin.length ? 'bg-kanovi-wood scale-110 shadow-[0_0_15px_rgba(169,113,66,0.6)]' : 'bg-kanovi-cream/60 dark:bg-white/10'}`} />
              ))}
            </div>

            {/* PERBAIKAN LINTER: max-w-[240px] jadi max-w-60 dan sm:max-w-70 */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-60 sm:max-w-70 mx-auto">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button key={num} onClick={() => handleNumberClick(num.toString())} disabled={isLoading} className="aspect-square bg-kanovi-cream/40 dark:bg-white/5 hover:bg-kanovi-cream/80 dark:hover:bg-white/10 active:bg-kanovi-wood active:text-white rounded-2xl text-xl sm:text-2xl font-bold text-kanovi-coffee dark:text-kanovi-bone transition-all active:scale-95 border border-kanovi-cream/50 dark:border-white/5">{num}</button>
              ))}
              <div />
              <button onClick={() => handleNumberClick("0")} disabled={isLoading} className="aspect-square bg-kanovi-cream/40 dark:bg-white/5 hover:bg-kanovi-cream/80 dark:hover:bg-white/10 active:bg-kanovi-wood active:text-white rounded-2xl text-xl sm:text-2xl font-bold text-kanovi-coffee dark:text-kanovi-bone transition-all active:scale-95 border border-kanovi-cream/50 dark:border-white/5">0</button>
              <button onClick={handleDelete} disabled={isLoading || pin.length === 0} className="aspect-square bg-kanovi-danger/10 hover:bg-kanovi-danger/20 dark:bg-kanovi-danger/20 dark:hover:bg-kanovi-danger/30 text-kanovi-danger dark:text-red-400 rounded-2xl text-xl sm:text-2xl font-bold flex items-center justify-center transition-all active:scale-95 disabled:opacity-50 border border-kanovi-danger/20">⌫</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}