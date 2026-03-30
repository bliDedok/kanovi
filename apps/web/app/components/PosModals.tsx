import { Trash2, AlertTriangle, X, QrCode, CheckCircle2 } from "lucide-react";
import { PaymentMethod, ShortageItem, CartItem } from "../../types";

// --- MODAL CLEAR CART ---
export function ClearCartModal({ isOpen, onClose, onConfirm }: { isOpen: boolean, onClose: () => void, onConfirm: () => void }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-150 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-kanovi-paper dark:bg-kanovi-darker rounded-2rem shadow-2xl w-full max-w-sm p-6 border border-kanovi-cream/50 dark:border-white/5 relative animate-in zoom-in-95 duration-200">
        <div className="w-16 h-16 mx-auto bg-red-100 dark:bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-4">
          <Trash2 className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-black text-kanovi-coffee dark:text-kanovi-bone mb-2 text-center">Kosongkan Keranjang?</h3>
        <p className="text-sm text-kanovi-coffee/70 dark:text-kanovi-cream/70 text-center mb-6 font-medium">Semua pesanan yang sudah diinput akan dihapus dan tidak bisa dikembalikan.</p>
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
    <div className="fixed inset-0 z-150 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-kanovi-paper dark:bg-kanovi-darker rounded-2rem shadow-2xl w-full max-w-sm p-8 border border-kanovi-cream/50 dark:border-white/5 relative animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black text-kanovi-coffee dark:text-kanovi-bone">Pembayaran Tunai</h3>
          <button onClick={onClose} className="p-2 hover:bg-kanovi-cream/50 dark:hover:bg-white/10 rounded-full transition-colors">
            <X className="w-5 h-5 text-kanovi-coffee dark:text-kanovi-bone opacity-50" />
          </button>
        </div>
        
        <div className="bg-kanovi-bone dark:bg-black/20 p-5 rounded-2xl mb-6 text-center border border-kanovi-cream/50 dark:border-white/5">
          <p className="text-[10px] text-kanovi-coffee/70 dark:text-kanovi-cream/70 font-black tracking-widest uppercase mb-1">Total Tagihan</p>
          <p className="text-3xl font-black text-kanovi-wood dark:text-kanovi-cream">Rp {totalTagihan.toLocaleString("id-ID")}</p>
        </div>

        <div className="mb-5 text-kanovi-coffee dark:text-kanovi-bone">
          <label className="block text-[10px] font-black uppercase tracking-widest mb-2 opacity-60">Uang Diterima (Rp)</label>
          <input 
            type="text" 
            inputMode="numeric" 
            value={cashReceived ? Number(cashReceived).toLocaleString("id-ID") : ""} 
            onChange={(e) => setCashReceived(e.target.value.replace(/[^0-9]/g, ""))} 
            placeholder="0" 
            className="w-full px-5 py-4 bg-white dark:bg-black/40 border border-kanovi-cream dark:border-white/10 rounded-2xl text-right text-2xl font-black focus:outline-none focus:ring-2 focus:ring-kanovi-wood text-kanovi-coffee dark:text-kanovi-bone transition-all" 
            autoFocus 
          />
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {uniqueSuggestedAmounts.map((amt: number, idx: number) => (
            <button key={idx} onClick={() => setCashReceived(amt.toString())} className="py-3 bg-kanovi-cream/20 hover:bg-kanovi-cream/50 dark:bg-white/5 dark:hover:bg-white/10 text-kanovi-coffee dark:text-kanovi-bone rounded-xl text-sm font-bold border border-kanovi-cream/50 dark:border-white/5 transition-colors active:scale-95">
              {amt === totalTagihan ? "Uang Pas" : `Rp ${amt.toLocaleString("id-ID")}`}
            </button>
          ))}
        </div>

        <div className={`p-4 rounded-xl mb-6 flex justify-between items-center border-2 transition-colors ${isEnough ? "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900/30 text-green-600 dark:text-green-400" : "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400"}`}>
          <span className="font-black text-[10px] uppercase tracking-widest">{isEnough ? "Kembalian" : "Kurang"}</span>
          <span className="text-xl font-black">Rp {Math.abs(kembalian).toLocaleString("id-ID")}</span>
        </div>

        <button onClick={() => onProcess("CASH")} disabled={!isEnough || cashNum === 0 || isSubmitting} className="w-full py-4 bg-kanovi-wood hover:bg-kanovi-coffee text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-xl disabled:opacity-50 disabled:active:scale-100 active:scale-95 transition-all">
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
    <div className="fixed inset-0 z-150 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-kanovi-paper dark:bg-kanovi-darker rounded-2rem shadow-2xl w-full max-w-sm p-8 border border-kanovi-cream/50 dark:border-white/5 relative animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black text-kanovi-coffee dark:text-kanovi-bone flex items-center gap-2">
            <QrCode className="w-6 h-6 text-kanovi-wood" /> Pembayaran QRIS
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-kanovi-cream/50 dark:hover:bg-white/10 rounded-full transition-colors">
            <X className="w-5 h-5 text-kanovi-coffee dark:text-kanovi-bone opacity-50" />
          </button>
        </div>
        
        <div className="bg-kanovi-bone dark:bg-black/20 p-8 rounded-3xl mb-8 text-center border border-kanovi-cream/50 dark:border-white/5 shadow-inner">
          <p className="text-[10px] text-kanovi-coffee/70 dark:text-kanovi-cream/70 font-black tracking-widest uppercase mb-2">Total Tagihan</p>
          <p className="text-4xl font-black text-kanovi-wood dark:text-kanovi-cream">Rp {totalTagihan.toLocaleString("id-ID")}</p>
          <p className="text-[10px] text-gray-500 font-bold mt-4 italic">Arahkan customer untuk scan QRIS di meja kasir.</p>
        </div>

        <button onClick={() => onProcess("QRIS")} disabled={isSubmitting} className="w-full py-4 bg-kanovi-wood hover:bg-kanovi-coffee text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-xl transition-all active:scale-95 disabled:opacity-50">
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
    <div className="fixed inset-0 z-160 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-kanovi-paper dark:bg-kanovi-darker rounded-2rem shadow-2xl w-full max-w-sm p-8 border-2 border-yellow-400/50 dark:border-yellow-500/30 relative text-center animate-in zoom-in-95 duration-200">
        <div className="w-16 h-16 mx-auto bg-yellow-100 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-black text-kanovi-coffee dark:text-kanovi-bone mb-2">Stok Sistem Tidak Cukup</h3>
        <p className="text-xs text-kanovi-coffee/80 dark:text-kanovi-cream/80 mb-6 font-medium">Sistem mendeteksi kekurangan stok bahan baku. Jika stok fisik nyatanya masih ada, transaksi bisa dilanjutkan (Override).</p>
        
        {shortages.length > 0 && (
          <div className="mb-6 max-h-40 overflow-y-auto custom-scrollbar text-left bg-yellow-50 dark:bg-yellow-500/5 border border-yellow-200 dark:border-yellow-500/20 rounded-2xl p-4">
            <div className="text-[10px] font-black uppercase tracking-widest mb-3 text-yellow-700 dark:text-yellow-500">Detail Kekurangan:</div>
            <div className="space-y-3">
              {shortages.map((item: any) => (
                <div key={item.ingredientId} className="text-xs text-kanovi-coffee dark:text-kanovi-bone border-l-2 border-yellow-400 pl-2">
                  <div className="font-black uppercase">{item.ingredientName}</div>
                  <div className="text-[10px] opacity-70 mt-0.5">Sisa: {item.stock} {item.unit} | Butuh: {item.need} {item.unit}</div>
                  <div className="text-[10px] font-bold text-red-500 mt-0.5">Kurang: {item.shortBy} {item.unit}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mb-6 text-left">
          <label className="block text-[10px] font-black uppercase tracking-widest text-kanovi-coffee dark:text-kanovi-bone mb-2">Alasan Override <span className="text-red-500 normal-case text-xs italic">*wajib</span></label>
          <textarea 
            className="w-full px-4 py-3 text-sm border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-black/40 text-kanovi-coffee dark:text-kanovi-bone focus:ring-2 focus:ring-yellow-500 focus:outline-none transition-all" 
            placeholder="Cth: Sisa susu di kulkas masih ada 1 kotak baru..." 
            value={overrideReason} 
            onChange={(e) => setOverrideReason(e.target.value)} 
            rows={2} 
            required 
          />
        </div>

        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 bg-kanovi-bone dark:bg-white/5 hover:bg-kanovi-cream/50 dark:hover:bg-white/10 text-kanovi-coffee dark:text-kanovi-bone font-black uppercase tracking-widest text-[10px] rounded-xl transition-colors">Batal</button>
          <button onClick={() => onProcess(pendingMethod, true)} disabled={isSubmitting || !overrideReason.trim()} className="flex-1 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-md transition-colors disabled:opacity-50 disabled:active:scale-100 active:scale-95">
            {isSubmitting ? "Memproses..." : "Lanjut Override"}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- MODAL SUCCESS ---
export function SuccessModal({ isOpen, onClose, finalChange }: { isOpen: boolean, onClose: () => void, finalChange: number }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-200 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-kanovi-paper dark:bg-kanovi-darker rounded-2rem shadow-2xl w-full max-w-sm p-8 text-center border border-kanovi-cream/50 dark:border-white/5 animate-in zoom-in-75 duration-300">
        <div className="w-24 h-24 mx-auto bg-green-100 dark:bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mb-6 shadow-inner">
          <CheckCircle2 className="w-12 h-12 animate-bounce" />
        </div>
        <h2 className="text-2xl font-black mb-2 text-kanovi-coffee dark:text-kanovi-bone">Pembayaran Berhasil!</h2>
        
        <div className="bg-kanovi-bone dark:bg-black/20 rounded-2xl p-5 mb-8 mt-6 border border-kanovi-cream/50 dark:border-white/5">
          <p className="text-[10px] text-kanovi-coffee/70 dark:text-kanovi-cream/70 font-black tracking-widest uppercase mb-1">Kembalian Customer</p>
          <p className="text-4xl font-black text-kanovi-wood dark:text-kanovi-cream">Rp {finalChange.toLocaleString("id-ID")}</p>
        </div>
        
        <button onClick={onClose} className="w-full py-4 bg-kanovi-wood hover:bg-kanovi-coffee text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-xl active:scale-95 transition-all">
          Pesanan Baru
        </button>
      </div>
    </div>
  );
}

// --- MODAL HOLD BILL ---
interface HoldBill {
  id: number;
  customerName: string;
  cart: CartItem[];
}

interface HoldBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  holdBills: HoldBill[];
  onLoadBill: (bill: HoldBill) => void;
}

export function HoldBillModal({ isOpen, onClose, holdBills, onLoadBill }: HoldBillModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-150 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white dark:bg-kanovi-darker rounded-2rem shadow-2xl p-6 animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black text-kanovi-coffee dark:text-white flex items-center gap-2">
             Bill Tersimpan
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors">
             <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        
        <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
          {holdBills.length === 0 ? (
            <div className="text-center py-10 opacity-50">
               <p className="text-sm font-bold text-kanovi-coffee dark:text-white italic">Tidak ada bill yang disimpan.</p>
            </div>
          ) : (
            holdBills.map((bill) => (
              <div key={bill.id} className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl flex justify-between items-center border border-gray-100 dark:border-white/5 group hover:border-kanovi-wood/30 transition-all">
                <div>
                  <p className="font-black text-kanovi-coffee dark:text-white text-sm uppercase leading-tight">
                    {bill.customerName}
                  </p>
                  <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-widest">
                    {bill.cart.length} Item Tersimpan
                  </p>
                </div>
                <button 
                  onClick={() => onLoadBill(bill)} 
                  className="px-5 py-2.5 bg-kanovi-wood text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-md hover:bg-kanovi-coffee active:scale-95 transition-all"
                >
                  Panggil
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}