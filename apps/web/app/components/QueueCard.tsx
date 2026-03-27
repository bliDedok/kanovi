import { Clock, CheckCircle, PlayCircle } from "lucide-react";
import { Order } from "../../types";

type QueueCardProps = {
  order: Order;
  diffMins: number;
  isOverdue: boolean;
  onUpdateStatus: (orderId: number, newStatus: string) => void;
};

export default function QueueCard({ order, diffMins, isOverdue, onUpdateStatus }: QueueCardProps) {
  return (
    <div 
      className={`flex flex-col rounded-3xl shadow-lg border-2 overflow-hidden transition-all duration-300
        ${isOverdue && order.status !== 'READY' 
          ? 'border-red-500 bg-red-50 dark:bg-red-900/10' 
          : order.status === 'READY'
          ? 'border-green-500 bg-green-50 dark:bg-green-900/10' 
          : 'border-transparent bg-kanovi-bone dark:bg-[#1a1a1a]'
        }`}
    >
      <div className={`p-5 text-white flex justify-between items-center
        ${order.status === 'NEW' ? 'bg-blue-600 dark:bg-blue-600/80' : 
          order.status === 'IN_PROGRESS' ? 'bg-orange-500 dark:bg-orange-600/80' : 'bg-green-600 dark:bg-green-600/80'}`}>
        <div>
          <span className="text-xs font-bold uppercase opacity-80 block tracking-wider">Order</span>
          <span className="text-2xl font-black">#{order.id}</span>
        </div>
        <div className="text-right flex flex-col items-end">
          <span className="text-xs font-bold uppercase opacity-80 block tracking-wider">Tunggu</span>
          <span className="text-xl font-bold flex items-center gap-1.5 bg-black/20 px-2 py-1 rounded-lg">
            <Clock className="w-5 h-5" /> {diffMins}m
          </span>
        </div>
      </div>
      
      <div className="px-5 py-3 bg-white/50 dark:bg-black/20 border-b border-kanovi-cream/50 dark:border-white/5 font-bold text-kanovi-coffee dark:text-gray-200 text-lg">
        {order.customerName || "Pelanggan Counter"}
      </div>
      
      <div className="p-5 flex-1">
        <ul className="space-y-4">
          {order.details.map((item) => (
            <li key={item.id} className="flex justify-between items-center text-kanovi-coffee dark:text-gray-300">
              <span className="font-semibold text-lg leading-tight pr-4">{item.menu.name}</span>
              <span className="font-black text-xl bg-white dark:bg-gray-800 border border-kanovi-cream/50 dark:border-white/10 w-10 h-10 flex items-center justify-center rounded-xl shrink-0 shadow-sm text-kanovi-wood dark:text-yellow-500">
                {item.qty}
              </span>
            </li>
          ))}
        </ul>
      </div>
      
      <div className="p-5 bg-white/30 dark:bg-black/20 mt-auto border-t border-kanovi-cream/50 dark:border-white/5">
        {order.status === 'NEW' && (
          <button onClick={() => onUpdateStatus(order.id, 'IN_PROGRESS')} className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors text-lg shadow-md">
            <PlayCircle className="w-6 h-6" /> Proses Pesanan
          </button>
        )}
        {order.status === 'IN_PROGRESS' && (
          <button onClick={() => onUpdateStatus(order.id, 'READY')} className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors text-lg shadow-md">
            <CheckCircle className="w-6 h-6" /> Selesai Dibuat
          </button>
        )}
        {order.status === 'READY' && (
          <button onClick={() => onUpdateStatus(order.id, 'DONE')} className="w-full py-3 bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 font-bold rounded-xl flex items-center justify-center transition-colors hover:bg-green-200 dark:hover:bg-green-500/20 border border-green-200 dark:border-green-500/20">
            Sembunyikan dari Layar
          </button>
        )}
      </div>
    </div>
  );
}