"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Hardcode daftar pegawai untuk demo UAS
const USERS = [
  { username: "novi", name: "Kak Novi", role: "Owner", icon: "👩‍💼" },
  { username: "dimas", name: "Kak Dimas", role: "Owner", icon: "👨‍💼" },
  { username: "diah", name: "Kak Diah", role: "Kasir", icon: "👩‍🍳" },
  { username: "reza", name: "Kak Reza", role: "Kasir", icon: "👨‍🍳" },
];

export default function LoginPage() {
  // PERBAIKAN 1: Tambahkan role dan icon ke dalam tipe data TypeScript-nya
  const [selectedUser, setSelectedUser] = useState<{ username: string, name: string, role: string, icon: string } | null>(null);
  const [pin, setPin] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleNumberClick = (num: string) => {
    // PERBAIKAN 2: Ubah batas maksimal ketikan PIN menjadi 6 digit
    if (pin.length < 6) { 
      const newPin = pin + num;
      setPin(newPin);
      setErrorMsg("");

      // PERBAIKAN 3: Jika sudah mencapai 6 digit, otomatis submit login
      if (newPin.length === 6) {
        submitLogin(selectedUser!.username, newPin);
      }
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
  };

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
        setPin(""); // Kosongkan PIN jika salah
        setIsLoading(false);
        return;
      }

      // Simpan Cookies
      document.cookie = `kanovi_token=${data.token}; path=/; max-age=86400;`;
      document.cookie = `kanovi_role=${data.role}; path=/; max-age=86400;`;

      // Redirect berdasarkan Role
      if (data.role === 'OWNER') {
        router.push("/dashboard");
      } else {
        router.push("/pos");
      }
      router.refresh();

    } catch (error) {
      setErrorMsg("Server error.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 font-sans text-white">
      <div className="w-full max-w-md bg-gray-800 p-8 rounded-3xl shadow-2xl border border-gray-700">
        
        {/* HEADER */}
        <div className="text-center mb-8">
          <div className="bg-green-600 w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4 text-3xl shadow-lg">☕</div>
          <h1 className="text-3xl font-bold">Kanovi POS</h1>
          <p className="text-gray-400 mt-2">{selectedUser ? "Masukkan 6 Digit PIN Anda" : "Siapa yang sedang bertugas?"}</p>
        </div>

        {errorMsg && (
          <div className="bg-red-500/20 text-red-400 p-3 rounded-lg text-center mb-6 border border-red-500/30 animate-pulse">
            {errorMsg}
          </div>
        )}

        {/* TAHAP 1: PILIH AKUN */}
        {!selectedUser && (
          <div className="grid grid-cols-2 gap-4 animate-fade-in">
            {USERS.map((u) => (
              <button
                key={u.username}
                onClick={() => setSelectedUser(u)}
                className="bg-gray-700 hover:bg-gray-600 p-4 rounded-2xl flex flex-col items-center gap-2 transition-transform hover:scale-105"
              >
                <span className="text-4xl">{u.icon}</span>
                <span className="font-semibold">{u.name}</span>
                <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded-full">{u.role}</span>
              </button>
            ))}
          </div>
        )}

        {/* TAHAP 2: INPUT PIN */}
        {selectedUser && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-8 bg-gray-700 p-3 rounded-xl">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{selectedUser.icon}</span>
                <span className="font-semibold">{selectedUser.name}</span>
              </div>
              <button 
                onClick={() => { setSelectedUser(null); setPin(""); setErrorMsg(""); }}
                className="text-sm bg-gray-600 hover:bg-gray-500 px-3 py-1 rounded-lg transition"
              >
                Ganti Akun
              </button>
            </div>

            {/* PERBAIKAN 4: Indikator Bulatan PIN menjadi 6 buah */}
            <div className="flex justify-center gap-3 mb-8">
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <div 
                  key={index} 
                  className={`w-5 h-5 rounded-full transition-colors duration-300 ${index < pin.length ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]' : 'bg-gray-700'}`}
                />
              ))}
            </div>

            {/* Keypad Angka - PERBAIKAN 5: Mengubah max-w-[280px] jadi max-w-70 sesuai saran linter */}
            <div className="grid grid-cols-3 gap-4 max-w-70 mx-auto">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  onClick={() => handleNumberClick(num.toString())}
                  disabled={isLoading}
                  className="aspect-square bg-gray-700 hover:bg-gray-600 active:bg-gray-500 rounded-2xl text-2xl font-bold transition-transform active:scale-95"
                >
                  {num}
                </button>
              ))}
              <div /> {/* Kosong untuk rata tengah angka 0 */}
              <button
                onClick={() => handleNumberClick("0")}
                disabled={isLoading}
                className="aspect-square bg-gray-700 hover:bg-gray-600 active:bg-gray-500 rounded-2xl text-2xl font-bold transition-transform active:scale-95"
              >
                0
              </button>
              <button
                onClick={handleDelete}
                disabled={isLoading || pin.length === 0}
                className="aspect-square bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-2xl text-2xl font-bold flex items-center justify-center transition-transform active:scale-95 disabled:opacity-50"
              >
                ⌫
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}