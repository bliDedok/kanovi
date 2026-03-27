import { Trash2, AlertTriangle } from "lucide-react";
import { PaymentMethod, ShortageItem } from "../../types";

// --- MODAL CLEAR CART ---
export function ClearCartModal({ isOpen, onClose, onConfirm }: { isOpen: boolean, onClose: () => void, onConfirm: () => void }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-kanovi-paper dark:bg-kanovi-darker rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-kanovi-cream/50 dark:border-white/5 relative">
        <div className="w-16 h-16 mx-auto bg-red-100 dark:bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mb-4"><Trash2 className="w-8 h-8" /></div>
        <h3 className="text-xl font-bold text-kanovi-coffee dark:text-kanovi-bone mb-2 text-center">Kosongkan Keranjang?</h3>
        <p className="text-sm text-kanovi-coffee/70 dark:text-kanovi-cream/70 text-center mb-6">Semua pesanan yang sudah diinput akan dihapus dan tidak bisa dikembalikan.</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 bg-kanovi-bone dark:bg-white/5 hover:bg-kanovi-cream/50 dark:hover:bg-white/10 text-kanovi-coffee dark:text-kanovi-bone font-bold rounded-xl transition-colors">Batal</button>
          <button onClick={onConfirm} className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-md transition-colors">Hapus Semua</button>
        </div>
      </div>
    </div>
  );
}

// --- MODAL CASH ---
export function CashModal({ isOpen, onClose, totalTagihan, cashReceived, setCashReceived, uniqueSuggestedAmounts, isEnough, kembalian, cashNum, isSubmitting, onProcess }: any) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-kanovi-paper dark:bg-kanovi-darker rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-kanovi-cream/50 dark:border-white/5 relative">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-kanovi-coffee dark:text-kanovi-bone">Pembayaran Tunai</h3>
          <button onClick={onClose} className="text-2xl text-kanovi-coffee dark:text-kanovi-bone opacity-50">&times;</button>
        </div>
        <div className="bg-kanovi-bone dark:bg-kanovi-dark p-4 rounded-xl mb-6 text-center border border-kanovi-cream/30 dark:border-white/5">
          <p className="text-xs text-kanovi-coffee/70 dark:text-kanovi-cream/70 font-bold uppercase mb-1">Total Tagihan</p>
          <p className="text-3xl font-bold text-kanovi-wood dark:text-kanovi-cream">Rp {totalTagihan.toLocaleString("id-ID")}</p>
        </div>
        <div className="mb-4 text-kanovi-coffee dark:text-kanovi-bone">
          <label className="block text-sm font-bold mb-2 opacity-80">Uang Diterima (Rp)</label>
          <input type="text" inputMode="numeric" value={cashReceived ? Number(cashReceived).toLocaleString("id-ID") : ""} onChange={(e) => setCashReceived(e.target.value.replace(/[^0-9]/g, ""))} placeholder="0" className="w-full px-4 py-3 bg-white dark:bg-black/20 border border-kanovi-cream dark:border-white/10 rounded-xl text-right text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-kanovi-wood text-kanovi-coffee dark:text-kanovi-bone" autoFocus />
        </div>
        <div className="grid grid-cols-2 gap-2 mb-6">
          {uniqueSuggestedAmounts.map((amt: number, idx: number) => (
            <button key={idx} onClick={() => setCashReceived(amt.toString())} className="py-2.5 bg-kanovi-cream/30 hover:bg-kanovi-cream/60 dark:bg-white/5 dark:hover:bg-white/10 text-kanovi-coffee dark:text-kanovi-bone rounded-lg text-sm font-bold border border-kanovi-cream/50 dark:border-white/10">
              {amt === totalTagihan ? "Uang Pas" : `Rp ${amt.toLocaleString("id-ID")}`}
            </button>
          ))}
        </div>
        <div className={`p-4 rounded-xl mb-6 flex justify-between items-center border ${isEnough ? "bg-green-100 dark:bg-green-900/20 border-green-200 text-green-700 dark:text-green-400" : "bg-red-100 dark:bg-red-900/20 border-red-200 text-red-600 dark:text-red-400"}`}>
          <span className="font-bold text-sm">{isEnough ? "Kembalian" : "Kurang"}</span>
          <span className="text-xl font-bold">Rp {Math.abs(kembalian).toLocaleString("id-ID")}</span>
        </div>
        <button onClick={() => onProcess("CASH")} disabled={!isEnough || cashNum === 0 || isSubmitting} className="w-full py-4 bg-kanovi-wood hover:bg-kanovi-coffee text-white font-bold rounded-xl shadow-md disabled:opacity-50 transition-colors">
          {isSubmitting ? "Memproses..." : "Selesaikan Pembayaran"}
        </button>
      </div>
    </div>
  );
}

// --- MODAL QRIS ---
export function QrisModal({ isOpen, onClose, totalTagihan, isSubmitting, onProcess }: any) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-kanovi-paper dark:bg-kanovi-darker rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-kanovi-cream/50 dark:border-white/5 relative">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-kanovi-coffee dark:text-kanovi-bone">Pembayaran QRIS</h3>
          <button onClick={onClose} className="text-2xl text-kanovi-coffee dark:text-kanovi-bone opacity-50">&times;</button>
        </div>
        <div className="bg-kanovi-bone dark:bg-kanovi-dark p-6 rounded-xl mb-6 text-center border border-kanovi-cream/30 dark:border-white/5">
          <p className="text-sm text-kanovi-coffee/70 dark:text-kanovi-cream/70 font-bold uppercase mb-2">Total Tagihan</p>
          <p className="text-4xl font-black text-kanovi-wood dark:text-kanovi-cream">Rp {totalTagihan.toLocaleString("id-ID")}</p>
        </div>
        <button onClick={() => onProcess("QRIS")} disabled={isSubmitting} className="w-full py-4 bg-kanovi-wood hover:bg-kanovi-coffee text-white font-bold rounded-xl shadow-md transition-colors disabled:opacity-50">
          {isSubmitting ? "Memproses..." : "Konfirmasi Uang Masuk"}
        </button>
      </div>
    </div>
  );
}

// --- MODAL SHORTAGE ---
export function ShortageModal({ isOpen, shortages, overrideReason, setOverrideReason, isSubmitting, onCancel, onProcess, pendingMethod }: any) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-kanovi-paper dark:bg-kanovi-darker rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-yellow-500/50 dark:border-yellow-400/30 relative text-center">
        <div className="w-16 h-16 mx-auto bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 rounded-full flex items-center justify-center mb-4"><AlertTriangle className="w-8 h-8" /></div>
        <h3 className="text-xl font-bold text-kanovi-coffee dark:text-kanovi-bone mb-2">Stok Sistem Tidak Cukup</h3>
        <p className="text-sm text-kanovi-coffee/80 dark:text-kanovi-cream/80 mb-4 px-2">Sistem mendeteksi kekurangan stok. Kalau stok fisik masih ada, transaksi bisa dilanjutkan dengan override.</p>
        {shortages.length > 0 && (
          <div className="mb-4 max-h-40 overflow-y-auto text-left bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-400/20 rounded-xl p-3">
            <div className="text-xs font-bold mb-2 text-yellow-700 dark:text-yellow-300">Detail shortage:</div>
            <div className="space-y-2">
              {shortages.map((item: any) => (
                <div key={item.ingredientId} className="text-xs text-kanovi-coffee dark:text-kanovi-bone">
                  <div className="font-semibold">{item.ingredientName}</div>
                  <div>Stock: {item.stock} {item.unit} · Need: {item.need} {item.unit}</div>
                  <div>Kurang: {item.shortBy} {item.unit}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="mb-5 text-left">
          <label className="block text-sm font-bold text-kanovi-coffee dark:text-kanovi-bone mb-2">Alasan Override <span className="text-red-500">*wajib</span></label>
          <textarea className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-kanovi-darker text-kanovi-coffee dark:text-kanovi-bone focus:ring-2 focus:ring-yellow-500 focus:outline-none" placeholder="Cth: Sisa susu di kulkas masih ada..." value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} rows={2} required />
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 bg-kanovi-bone dark:bg-white/5 hover:bg-kanovi-cream/50 dark:hover:bg-white/10 text-kanovi-coffee dark:text-kanovi-bone font-bold rounded-xl transition-colors border border-kanovi-cream/50 dark:border-white/10">Batal Transaksi</button>
          <button onClick={() => onProcess(pendingMethod, true)} disabled={isSubmitting || !overrideReason.trim()} className="flex-1 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-xl shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed">{isSubmitting ? "Memproses..." : "Lanjut Override"}</button>
        </div>
      </div>
    </div>
  );
}

// --- MODAL SUCCESS ---
export function SuccessModal({ isOpen, onClose, finalChange }: { isOpen: boolean, onClose: () => void, finalChange: number }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-kanovi-paper dark:bg-kanovi-darker rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center border border-kanovi-cream/50 dark:border-white/5">
        <div className="w-20 h-20 mx-auto bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mb-6"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-10 h-10"><polyline points="20 6 9 17 4 12"></polyline></svg></div>
        <h2 className="text-2xl font-bold mb-2 text-kanovi-coffee dark:text-kanovi-bone">Pembayaran Berhasil!</h2>
        <div className="bg-kanovi-bone dark:bg-kanovi-dark rounded-xl p-4 mb-8 mt-4 border border-kanovi-cream/50 dark:border-white/5">
          <p className="text-xs text-kanovi-coffee/70 dark:text-kanovi-cream/70 font-bold uppercase mb-1">Kembalian</p>
          <p className="text-3xl font-bold text-kanovi-wood dark:text-kanovi-cream">Rp {finalChange.toLocaleString("id-ID")}</p>
        </div>
        <button onClick={onClose} className="w-full py-4 bg-kanovi-wood hover:bg-kanovi-coffee text-white font-bold rounded-xl text-lg transition-colors">Pesanan Baru</button>
      </div>
    </div>
  );
}