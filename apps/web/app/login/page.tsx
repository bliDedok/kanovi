"use client"; // Wajib ditambahkan karena kita pakai state dan form

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); // Mencegah halaman reload saat form di-submit
    setErrorMsg("");
    setIsLoading(true);

    try {
      // Tembak API Fastify yang ada di port 3001
      const response = await fetch("http://localhost:3001/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      // Jika API mengembalikan error (misal password salah)
      if (!response.ok) {
        setErrorMsg(data.message || "Login gagal, silakan coba lagi.");
        setIsLoading(false);
        return;
      }

// Jika sukses, simpan token DAN role ke dalam Cookies
      document.cookie = `kanovi_token=${data.token}; path=/; max-age=86400;`; 
      document.cookie = `kanovi_role=${data.role}; path=/; max-age=86400;`; // Simpan role untuk dibaca Middleware

      // Logic Redirect berdasarkan Role
      if (data.role === 'OWNER') {
        router.push("/dashboard");
      } else {
        router.push("/pos");
      }
      
      router.refresh();

    } catch (error) {
      console.error(error);
      setErrorMsg("Gagal terhubung ke server. Pastikan API menyala.");
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#121212', color: 'white' }}>
      <div style={{ backgroundColor: '#1e1e1e', padding: '40px', borderRadius: '8px', width: '350px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Login Kanovi</h2>
        
        {errorMsg && (
          <div style={{ backgroundColor: '#ff4d4d', color: 'white', padding: '10px', borderRadius: '4px', marginBottom: '15px', fontSize: '14px' }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px' }}>Username</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: 'none', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px' }}>Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: 'none', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <button 
            type="submit" 
            disabled={isLoading}
            style={{ 
              marginTop: '10px', 
              padding: '10px', 
              backgroundColor: isLoading ? '#555' : '#4CAF50', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontWeight: 'bold'
            }}
          >
            {isLoading ? "Memproses..." : "Masuk"}
          </button>
        </form>
      </div>
    </div>
  );
}