"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<any[]>([]);
  const [cashReceived, setCashReceived] = useState<string>("");
  
  // STATE BARU: Untuk menampilkan Pop-up Sukses
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    const savedCart = localStorage.getItem("kanovi_cart");
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    } else {
      router.push("/pos");
    }
    if (localStorage.getItem("kanovi_theme") === "dark") {
      document.documentElement.classList.add("dark");
    }
  }, [router]);

  const totalTagihan = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const cashNum = parseInt(cashReceived.replace(/[^0-9]/g, "")) || 0;
  const kembalian = cashNum - totalTagihan;
  const isEnough = cashNum >= totalTagihan;

  const suggestedAmounts = [totalTagihan];
  const nextTenThousand = Math.ceil(totalTagihan / 10000) * 10000;
  if (nextTenThousand > totalTagihan) suggestedAmounts.push(nextTenThousand);
  if (totalTagihan < 50000) suggestedAmounts.push(50000);
  if (totalTagihan < 100000) suggestedAmounts.push(100000);
  
  const uniqueSuggestedAmounts = Array.from(new Set(suggestedAmounts))
    .sort((a, b) => a - b)
    .slice(0, 4);

  const handleCashInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, "");
    setCashReceived(rawValue);
  };

  // UBAHAN FUNGSI CHARGE: Sekarang memunculkan Pop-up, bukan langsung pindah halaman
  const handleCharge = async () => {
    if (!isEnough) return toast.error("Uang yang diterima kurang!");
    
    const toastId = toast.loading("Memproses pembayaran...");
    try {
      // Simulasi API call... (Nanti diganti POST ke /api/orders)
      await new Promise(resolve => setTimeout(resolve, 800));
      
      toast.success("Berhasil!", { id: toastId });
      
      // Hapus keranjang di background agar siap untuk pesanan berikutnya
      localStorage.removeItem("kanovi_cart"); 
      
      // Tampilkan Modal Sukses
      setShowSuccessModal(true);
      
    } catch (error) {
      toast.error("Gagal memproses pembayaran", { id: toastId });
    }
  };

  return (
    <div className="flex h-screen bg-kanovi-bone dark:bg-kanovi-dark transition-colors duration-300 font-sans overflow-hidden relative">
      
      {/* =========================================
          KIRI: STRUK PESANAN (TICKET)
          ========================================= */}
      <div className="w-80 lg:w-96 shrink-0 bg-kanovi-paper dark:bg-kanovi-darker border-r border-kanovi-cream/50 dark:border-white/5 flex flex-col shadow-xl z-10">
        
        <div className="h-16 flex items-center px-4 sm:px-6 border-b border-kanovi-cream/50 dark:border-white/5 shrink-0">
          <button 
            onClick={() => router.push("/pos")}
            className="flex items-center gap-2 text-kanovi-coffee dark:text-kanovi-bone font-bold hover:opacity-70 transition-opacity"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            Ticket
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
          {cart.map((item, idx) => (
            <div key={idx} className="flex justify-between items-start py-3 border-b border-kanovi-cream/30 dark:border-white/5 last:border-0 text-kanovi-coffee dark:text-kanovi-bone">
              <span className="font-medium text-sm md:text-base leading-tight w-2/3">
                {item.name} <span className="text-kanovi-wood dark:text-kanovi-cream/70 text-xs md:text-sm">x {item.qty}</span>
              </span>
              <span className="font-semibold text-sm md:text-base">Rp {(item.price * item.qty).toLocaleString("id-ID")}</span>
            </div>
          ))}
        </div>

        <div className="p-4 sm:px-6 sm:py-5 bg-kanovi-bone/50 dark:bg-kanovi-dark/50 border-t border-kanovi-cream/50 dark:border-white/5 flex justify-between items-center text-kanovi-coffee dark:text-kanovi-bone shrink-0">
          <span className="font-bold text-base md:text-lg">Total</span>
          <span className="font-bold text-xl">Rp {totalTagihan.toLocaleString("id-ID")}</span>
        </div>
      </div>

      {/* =========================================
          KANAN: AREA PEMBAYARAN & KALKULATOR
          ========================================= */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-8 relative">
        
        <div className="w-full max-w-lg flex flex-col items-center">
          
          <h1 className="text-5xl md:text-6xl font-bold text-kanovi-coffee dark:text-kanovi-bone mb-2 text-center">
            Rp {totalTagihan.toLocaleString("id-ID")}
          </h1>
          <p className="text-kanovi-coffee/60 dark:text-kanovi-cream/50 text-base md:text-lg mb-8 md:mb-10 font-medium">Total amount due</p>

          <div className="w-full border-b border-kanovi-cream/50 dark:border-white/10 mb-8"></div>

          <div className="w-full mb-6">
            <div className="flex items-center gap-2 text-kanovi-wood dark:text-kanovi-cream font-bold mb-2 text-sm md:text-base">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><rect x="2" y="6" width="20" height="12" rx="2"></rect><circle cx="12" cy="12" r="2"></circle><path d="M6 12h.01M18 12h.01"></path></svg>
              <span>Cash received</span>
            </div>
            <input 
              type="text"
              inputMode="numeric"
              value={cashReceived ? `Rp ${Number(cashReceived).toLocaleString("id-ID")}` : ""}
              onChange={handleCashInput}
              placeholder="Rp 0"
              className="w-full bg-transparent border-b-2 border-kanovi-coffee/30 dark:border-white/30 text-3xl md:text-4xl font-bold text-kanovi-coffee dark:text-kanovi-bone pb-2 focus:outline-none focus:border-kanovi-wood dark:focus:border-kanovi-cream transition-colors"
              autoFocus
            />
          </div>

          {cashNum > 0 && (
            <div className="w-full flex justify-between items-center mb-6 text-lg md:text-xl">
              <span className="text-kanovi-coffee/70 dark:text-kanovi-cream/70 font-medium">Change</span>
              <span className={`font-bold ${isEnough ? 'text-kanovi-coffee dark:text-kanovi-bone' : 'text-kanovi-danger dark:text-red-400'}`}>
                {isEnough ? `Rp ${kembalian.toLocaleString("id-ID")}` : 'Uang Kurang'}
              </span>
            </div>
          )}

          <div className="w-full flex gap-3 md:gap-4 h-32 md:h-40">
            
            <div className="flex-1 grid grid-cols-2 gap-2 md:gap-3">
              {uniqueSuggestedAmounts.map((amt, idx) => (
                <button 
                  key={idx}
                  onClick={() => setCashReceived(amt.toString())}
                  className="bg-kanovi-paper dark:bg-kanovi-darker hover:bg-kanovi-wood dark:hover:bg-kanovi-cream hover:text-white dark:hover:text-kanovi-coffee text-kanovi-coffee dark:text-kanovi-bone text-sm md:text-base font-bold rounded-xl transition-all border border-kanovi-cream/50 dark:border-white/10 shadow-sm"
                >
                  RP {amt.toLocaleString("id-ID")}
                </button>
              ))}
            </div>

            <button 
              onClick={handleCharge}
              disabled={!isEnough || cashNum === 0}
              className="w-1/3 bg-kanovi-wood hover:bg-kanovi-coffee disabled:bg-kanovi-cream/50 dark:disabled:bg-white/5 disabled:text-kanovi-coffee/40 dark:disabled:text-white/20 text-white font-bold text-xl md:text-2xl rounded-xl transition-all shadow-md active:scale-95 disabled:active:scale-100 flex justify-center items-center border border-transparent disabled:border-kanovi-cream/50 dark:disabled:border-white/5"
            >
              CHARGE
            </button>
          </div>

        </div>
      </div>

      {/* =========================================
          POP-UP PEMBAYARAN BERHASIL (SUCCESS MODAL)
          ========================================= */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-kanovi-paper dark:bg-kanovi-darker rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center border border-kanovi-cream/50 dark:border-white/5 transform transition-all scale-100">
            
            {/* Ikon Centang Hijau Besar */}
            <div className="w-20 h-20 mx-auto bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mb-6 shadow-inner">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            
            <h2 className="text-2xl font-bold text-kanovi-coffee dark:text-kanovi-bone mb-2">Pembayaran Berhasil!</h2>
            
            <div className="bg-kanovi-bone dark:bg-kanovi-dark rounded-xl p-4 mb-8 mt-4 border border-kanovi-cream/50 dark:border-white/5">
              <p className="text-kanovi-coffee/70 dark:text-kanovi-cream/70 text-sm font-medium mb-1">Kembalian Customer</p>
              <p className="text-3xl font-bold text-kanovi-wood dark:text-kanovi-cream">
                Rp {kembalian.toLocaleString("id-ID")}
              </p>
            </div>

            <button
              onClick={() => router.push("/pos")}
              className="w-full py-4 bg-kanovi-wood hover:bg-kanovi-coffee text-white font-bold rounded-xl transition-all shadow-md active:scale-95 text-lg"
            >
              Pesanan Baru
            </button>
            
          </div>
        </div>
      )}

    </div>
  );
}