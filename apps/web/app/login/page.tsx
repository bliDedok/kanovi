"use client";

import { useState } from "react";
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
  const router = useRouter();

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
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 sm:p-8 font-sans text-white">
      <div className="w-full max-w-md bg-gray-800 p-6 sm:p-8 rounded-3xl shadow-2xl border border-gray-700">
        <div className="text-center mb-6 sm:mb-8">
          <div className="bg-green-600 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl mx-auto flex items-center justify-center mb-4 text-2xl sm:text-3xl shadow-lg">☕</div>
          <h1 className="text-2xl sm:text-3xl font-bold">Kanovi POS</h1>
          <p className="text-sm sm:text-base text-gray-400 mt-2">{selectedUser ? "Masukkan 6 Digit PIN Anda" : "Siapa yang sedang bertugas?"}</p>
        </div>

        {errorMsg && <div className="bg-red-500/20 text-red-400 p-3 rounded-lg text-center mb-6 border border-red-500/30 animate-pulse text-sm sm:text-base">{errorMsg}</div>}

        {!selectedUser && (
          /* RESPONSIVE: 1 kolom di HP (grid-cols-1), 2 kolom di iPad (sm:grid-cols-2) */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 animate-fade-in">
            {USERS.map((u) => (
              <button key={u.username} onClick={() => setSelectedUser(u)} className="bg-gray-700 hover:bg-gray-600 p-3 sm:p-4 rounded-2xl flex flex-row sm:flex-col items-center sm:justify-center gap-3 sm:gap-2 transition-transform hover:scale-105 text-left sm:text-center">
                <span className="text-3xl sm:text-4xl">{u.icon}</span>
                <div className="flex flex-col sm:items-center">
                  <span className="font-semibold text-sm sm:text-base">{u.name}</span>
                  <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded-full w-fit mt-1">{u.role}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {selectedUser && (
          <div className="animate-fade-in">
            <div className="flex flex-col sm:flex-row items-center justify-between mb-6 sm:mb-8 bg-gray-700 p-3 rounded-xl gap-3 sm:gap-0">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{selectedUser.icon}</span>
                <span className="font-semibold">{selectedUser.name}</span>
              </div>
              <button onClick={() => { setSelectedUser(null); setPin(""); setErrorMsg(""); }} className="text-xs sm:text-sm bg-gray-600 hover:bg-gray-500 px-3 py-1.5 rounded-lg w-full sm:w-auto transition">Ganti Akun</button>
            </div>

            <div className="flex justify-center gap-2 sm:gap-3 mb-6 sm:mb-8">
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <div key={index} className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full transition-colors duration-300 ${index < pin.length ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]' : 'bg-gray-700'}`} />
              ))}
            </div>

            <div className="grid grid-cols-3 gap-4 max-w-70 mx-auto">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button key={num} onClick={() => handleNumberClick(num.toString())} disabled={isLoading} className="aspect-square bg-gray-700 hover:bg-gray-600 active:bg-gray-500 rounded-2xl text-xl sm:text-2xl font-bold transition-transform active:scale-95">{num}</button>
              ))}
              <div />
              <button onClick={() => handleNumberClick("0")} disabled={isLoading} className="aspect-square bg-gray-700 hover:bg-gray-600 active:bg-gray-500 rounded-2xl text-xl sm:text-2xl font-bold transition-transform active:scale-95">0</button>
              <button onClick={handleDelete} disabled={isLoading || pin.length === 0} className="aspect-square bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-2xl text-xl sm:text-2xl font-bold flex items-center justify-center transition-transform active:scale-95 disabled:opacity-50">⌫</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}