import { Order } from "../../types";

type HistoryCardProps = {
  order: Order & { dailyNo: number };
  onVoid?: (id: number) => void; // <-- Tambahan Prop onVoid
};

export default function HistoryCard({ order, onVoid }: HistoryCardProps) {
  // Cek apakah order ini sudah di-void
  const isVoided = order.paymentStatus === "VOID";

  return (
    <div className={`border rounded-2xl p-4 md:p-5 transition-all ${isVoided ? 'bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-800 opacity-70' : 'bg-kanovi-bone dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-md'}`}>
      
      {/* HEADER KARTU */}
      <div className="flex justify-between items-start mb-4 border-b border-gray-200 dark:border-gray-700 pb-4">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="bg-white dark:bg-gray-900 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-center shadow-sm">
            <p className="text-[10px] text-gray-500 uppercase font-bold">No</p>
            <p className="text-lg md:text-xl font-black text-kanovi-coffee dark:text-white">#{order.dailyNo}</p>
          </div>
          <div>
            <h3 className={`font-bold text-base md:text-lg ${isVoided ? 'text-gray-400 line-through' : 'text-gray-800 dark:text-gray-200'}`}>
              {order.customerName || "Pelanggan Counter"}
            </h3>
            <p className="text-xs text-gray-500 mt-1 font-mono">
              Jam: {new Date(order.orderedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
        
        {/* BADGE STATUS */}
        <span className={`px-2 py-1 md:px-3 md:py-1 rounded-lg text-[10px] md:text-xs font-bold uppercase ${
          isVoided ? 'bg-gray-200 text-gray-500 dark:bg-gray-800 dark:text-gray-400 border border-gray-300 dark:border-gray-700' :
          order.status === 'DONE' ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400 border border-green-200 dark:border-green-500/20' : 
          order.status === 'READY' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20' : 
          'bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400 border border-orange-200 dark:border-orange-500/20'
        }`}>
          {isVoided ? 'VOID' : order.status}
        </span>
      </div>

      {/* DAFTAR ITEM */}
      <ul className="space-y-2 mb-4">
        {order.details.map((item) => (
          <li key={item.id} className={`flex items-center text-sm ${isVoided ? 'text-gray-400 line-through' : 'text-gray-700 dark:text-gray-300'}`}>
            <span className="w-8 font-black text-kanovi-coffee dark:text-gray-400">{item.qty}x</span> 
            <span className="font-medium">{item.menu.name}</span>
          </li>
        ))}
      </ul>

      {/* FOOTER & TOTAL HARGA */}
      <div className="pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <span className="text-xs text-gray-400 dark:text-gray-500">ID DB: {order.id}</span>
        <span className={`font-black text-base md:text-lg ${isVoided ? 'text-gray-400 line-through' : 'text-green-600 dark:text-green-400'}`}>
          Rp {order.totalPrice.toLocaleString('id-ID')}
        </span>
      </div>

      {/* TOMBOL AKSI VOID */}
      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/50 flex justify-end">
        {!isVoided ? (
          <button 
            onClick={() => onVoid && onVoid(order.id)}
            className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white dark:bg-red-500/10 dark:hover:bg-red-500 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all shadow-sm active:scale-95"
          >
            Void Transaksi
          </button>
        ) : (
          <span className="px-4 py-2 bg-gray-100 dark:bg-white/5 text-gray-400 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest border border-gray-200 dark:border-white/10 italic">
            Dibatalkan Manager
          </span>
        )}
      </div>

    </div>
  );
}