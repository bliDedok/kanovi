"use client";

import { useEffect, useState } from "react";
import { 
  TrendingUp, Wallet, ArrowDownCircle, AlertTriangle, 
  Building2, Calendar, Filter, Edit3, Save, X, Coffee, Plus, Eye, ShoppingBag, Receipt, Clock, CheckCircle2
} from "lucide-react";
import { api } from "../../../lib/api";

const formatRibuan = (value: string | number) => {
  const angka = String(value).replace(/\D/g, "");
  if (!angka || angka === "0") return "0";
  return parseInt(angka).toLocaleString("id-ID");
};

export default function FinanceReportPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState("ALL"); 
  const [editTarget, setEditTarget] = useState<any>(null);
  const [viewDetail, setViewDetail] = useState<any>(null);
  
  const [newExpense, setNewExpense] = useState({ amount: "", desc: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchReports = async () => {
    try {
      const data = await api.getFinanceReport();
      setReports(data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchReports(); }, []);

  // --- LOGIC PERHITUNGAN HARI INI (100% BERSIH / NET KANOVI) ---
  const today = new Date().toDateString();
  const todayReports = reports.filter(r => new Date(r.openedAt).toDateString() === today);

  // Pendapatan bersih adalah total semua shareKanovi (Pusat 100%, Restart 75%)
  const pendapatanBersihHariIni = todayReports.reduce((sum, r) => sum + r.shareKanovi, 0);
  const pusatHariIni = todayReports.filter(r => r.branch === "PUSAT").reduce((sum, r) => sum + r.shareKanovi, 0);
  const restartHariIniNet = todayReports.filter(r => r.branch === "RESTART").reduce((sum, r) => sum + r.shareKanovi, 0);

  // --- LOGIC TOTAL AKUMULASI (100% BERSIH / NET KANOVI) ---
  const totalPendapatanBersihAll = reports.reduce((sum, r) => sum + r.shareKanovi, 0);
  const totalSelisihAll = reports.reduce((sum, r) => sum + r.difference, 0);

  const handleUpdate = async (e: any) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (newExpense.amount && newExpense.desc) {
        await api.createExpense({
          sessionId: editTarget.id, amount: Number(newExpense.amount),
          description: newExpense.desc, recordedBy: "Owner (Koreksi)"
        });
      }
      await api.updateSession(editTarget.id, {
        actualCash: Number(editTarget.actualCash), initialCash: Number(editTarget.initialCash), note: editTarget.note
      });
      setEditTarget(null); setNewExpense({ amount: "", desc: "" }); fetchReports();
    } catch (err) { alert("Gagal update data"); } finally { setIsSubmitting(false); }
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-kanovi-dark">
      <div className="w-10 h-10 border-4 border-kanovi-wood border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-8 p-6 lg:p-10 pb-20 max-w-1600px mx-auto font-sans relative">
      
      {/* SECTION: EXECUTIVE DASHBOARD (HARI INI) */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-kanovi-wood animate-pulse" />
          <h2 className="text-xl font-black text-kanovi-coffee dark:text-white uppercase tracking-tighter">Ringkasan Hari Ini</h2>
          <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full font-black border border-emerald-500/20">LIVE</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* KARTU PENDAPATAN BERSIH */}
          <div className="bg-linear-to-br from-kanovi-wood to-kanovi-coffee p-6 rounded-2rem text-white shadow-xl shadow-kanovi-wood/20 relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-[10px] font-black uppercase opacity-80 tracking-widest mb-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Pendapatan Bersih (Net)
              </p>
              <h3 className="text-3xl font-black">Rp {pendapatanBersihHariIni.toLocaleString('id-ID')}</h3>
              <p className="mt-3 text-[9px] font-bold opacity-70 italic uppercase tracking-wider">Total pendapatan bersih masuk Kanovi</p>
            </div>
            {/* Dekorasi Background */}
            <TrendingUp className="absolute -bottom-4 -right-4 w-32 h-32 opacity-10 text-white" />
          </div>

          <div className="bg-white dark:bg-kanovi-darker p-6 rounded-2rem border border-kanovi-cream/50 dark:border-white/5 shadow-sm">
             <div className="flex justify-between items-start mb-2">
                <Coffee className="w-5 h-5 text-emerald-500" />
                <span className="text-[10px] font-black text-gray-400 uppercase">Pusat</span>
             </div>
             <p className="text-2xl font-black text-kanovi-coffee dark:text-white">Rp {pusatHariIni.toLocaleString('id-ID')}</p>
             <p className="text-[9px] text-gray-400 font-bold mt-1 uppercase italic tracking-widest">100% Milik Kanovi</p>
          </div>

          <div className="bg-white dark:bg-kanovi-darker p-6 rounded-2rem border border-kanovi-cream/50 dark:border-white/5 shadow-sm">
             <div className="flex justify-between items-start mb-2">
                <Building2 className="w-5 h-5 text-purple-500" />
                <span className="text-[10px] font-black text-gray-400 uppercase">Restart (Net)</span>
             </div>
             <p className="text-2xl font-black text-kanovi-coffee dark:text-white">Rp {restartHariIniNet.toLocaleString('id-ID')}</p>
             <p className="text-[9px] text-gray-400 font-bold mt-1 uppercase italic tracking-widest">Telah dipotong 25% Kampus</p>
          </div>
        </div>
      </section>

      <hr className="border-kanovi-cream/30 dark:border-white/5" />

      {/* SECTION: AUDIT & HISTORY */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-kanovi-coffee dark:text-white uppercase tracking-tighter">Audit & Akumulasi</h1>
          <p className="text-[10px] text-gray-500 mt-1 uppercase font-black tracking-widest italic">Data transaksi kotor untuk keperluan audit laci kasir</p>
        </div>
        <div className="flex bg-white dark:bg-white/5 p-1 rounded-2xl border border-kanovi-cream/30">
          {["ALL", "CASH", "QRIS"].map((mode) => (
            <button key={mode} onClick={() => setFilterMode(mode)} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterMode === mode ? "bg-kanovi-wood text-white shadow-lg" : "text-gray-400"}`}>
              {mode === "ALL" ? "Semua" : mode === "CASH" ? "Tunai" : "QRIS"}
            </button>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CardSummary title="Total Pendapatan Bersih (All Time)" value={totalPendapatanBersihAll} icon={<TrendingUp className="text-blue-500" />} desc="Akumulasi pendapatan bersih Kanovi sejak awal" />
        <CardSummary title="Total Selisih Laci Fisik" value={totalSelisihAll} icon={<AlertTriangle className="text-orange-500" />} isError={totalSelisihAll < 0} desc="Akumulasi uang lebih/kurang di laci kasir" />
      </section>

      <section className="bg-white dark:bg-kanovi-darker rounded-2rem border border-kanovi-cream/50 dark:border-white/5 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-black/40 text-[10px] uppercase tracking-widest text-gray-400 font-black">
                <th className="px-6 py-6">Sesi / Cabang</th>
                <th className="px-6 py-6">Uang Masuk (Gross)</th>
                <th className="px-6 py-6">Alokasi (Bagi Hasil)</th>
                <th className="px-6 py-6 text-center">Selisih Fisik</th>
                <th className="px-6 py-6 text-right pr-10">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {reports.map((report) => {
                const displayValue = filterMode === "CASH" ? report.cashSales : filterMode === "QRIS" ? report.qrisSales : report.totalSales;
                return (
                  <tr key={report.id} className="text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-all group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${report.branch === 'RESTART' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                           <Calendar className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-black text-kanovi-coffee dark:text-white uppercase text-[10px] flex items-center gap-1.5">
                            {report.branch} {new Date(report.openedAt).toDateString() === today && <span className="text-[8px] bg-emerald-500 text-white px-1 rounded">HARI INI</span>}
                          </div>
                          <div className="text-[10px] text-gray-400 font-bold">{new Date(report.openedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 font-black text-kanovi-coffee dark:text-white">
                      Rp {displayValue.toLocaleString('id-ID')}
                      <div className="text-[9px] text-gray-400 font-bold uppercase mt-1">Sblm dipotong</div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-[9px] font-black space-y-1 uppercase tracking-tighter">
                        {report.branch === "RESTART" && <div className="text-orange-500">Kampus (25%): Rp {report.shareKampus.toLocaleString('id-ID')}</div>}
                        <div className="text-emerald-500 bg-emerald-500/5 px-2 py-0.5 rounded inline-block">Kanovi (Net): Rp {report.shareKanovi.toLocaleString('id-ID')}</div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className={`inline-flex px-3 py-1 rounded-lg font-black text-[10px] ${report.difference < 0 ? "bg-red-50 text-red-500" : "bg-emerald-50 text-emerald-600"}`}>
                        {report.difference > 0 ? "+" : ""}{report.difference.toLocaleString('id-ID')}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex justify-end gap-2 pr-4">
                        <button onClick={() => setViewDetail(report)} className="p-2.5 bg-gray-50 dark:bg-white/5 hover:bg-blue-500 hover:text-white rounded-xl text-gray-400 transition-all border border-gray-200 dark:border-white/5 flex items-center gap-2 text-[10px] font-black uppercase"><Eye className="w-4 h-4" /> Detail</button>
                        <button onClick={() => setEditTarget({ ...report, actualCash: String(report.actualCash || 0), initialCash: String(report.initialCash || 0) })} className="p-2.5 hover:bg-kanovi-wood hover:text-white rounded-xl text-gray-400 transition-all border border-gray-200 dark:border-white/5"><Edit3 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* --- SIDEBAR DRAWER: DETAIL TRANSAKSI --- */}
      {viewDetail && (
        <div className="fixed inset-0 z-200 flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setViewDetail(null)} />
          <div className="relative w-full max-w-xl bg-kanovi-bone dark:bg-kanovi-dark h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
            <div className="p-8 bg-kanovi-coffee text-white shrink-0">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-tight">Detail Sesi #{viewDetail.id}</h2>
                  <p className="text-sm opacity-70 font-bold uppercase">{viewDetail.branch} • {new Date(viewDetail.openedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
                <button onClick={() => setViewDetail(null)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"><X className="w-6 h-6" /></button>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white/10 p-4 rounded-2xl border border-white/5"><p className="text-[10px] font-black uppercase opacity-60 mb-1">Total Masuk (Kotor)</p><p className="text-lg font-black">Rp {viewDetail.totalSales.toLocaleString('id-ID')}</p></div>
                <div className="bg-white/10 p-4 rounded-2xl border border-white/5"><p className="text-[10px] font-black uppercase opacity-60 mb-1">Dikeluarkan Kasir</p><p className="text-lg font-black text-red-300">Rp {viewDetail.expenses.toLocaleString('id-ID')}</p></div>
                <div className="bg-white/10 p-4 rounded-2xl border border-white/5"><p className="text-[10px] font-black uppercase opacity-60 mb-1">Selisih Kasir</p><p className={`text-lg font-black ${viewDetail.difference < 0 ? 'text-red-400' : 'text-emerald-400'}`}>Rp {viewDetail.difference.toLocaleString('id-ID')}</p></div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
              <section>
                <h3 className="text-sm font-black text-kanovi-coffee dark:text-white uppercase tracking-widest flex items-center gap-2 mb-4"><ShoppingBag className="w-4 h-4 text-emerald-500" /> Histori Penjualan Lunas</h3>
                <div className="space-y-3">
                  {viewDetail.orders?.length > 0 ? viewDetail.orders.map((order: any) => (
                    <div key={order.id} className="bg-white dark:bg-white/5 p-4 rounded-2xl border border-kanovi-cream/50 dark:border-white/5 flex justify-between items-center">
                      <div><p className="font-black text-kanovi-coffee dark:text-white text-xs uppercase">{order.customerName || "Customer"}</p><p className="text-[10px] text-gray-400 font-bold">{new Date(order.orderedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} • {order.paymentMethod}</p></div>
                      <p className="font-black text-kanovi-coffee dark:text-white">Rp {order.totalPrice.toLocaleString('id-ID')}</p>
                    </div>
                  )) : <p className="text-center py-10 text-xs text-gray-400 italic">Belum ada transaksi lunas.</p>}
                </div>
              </section>

              <section>
                <h3 className="text-sm font-black text-kanovi-coffee dark:text-white uppercase tracking-widest flex items-center gap-2 mb-4"><Receipt className="w-4 h-4 text-red-500" /> Histori Pengeluaran</h3>
                <div className="space-y-3">
                  {viewDetail.expenses_list?.length > 0 ? viewDetail.expenses_list.map((exp: any) => (
                    <div key={exp.id} className="bg-red-50/50 dark:bg-red-500/5 p-4 rounded-2xl border border-red-100 dark:border-red-500/10 flex justify-between items-center">
                      <div><p className="font-black text-red-600 dark:text-red-400 text-xs uppercase">{exp.description}</p><p className="text-[10px] text-gray-400 font-bold italic">Catatan: {exp.recordedBy}</p></div>
                      <p className="font-black text-red-600 dark:text-red-400">- Rp {exp.amount.toLocaleString('id-ID')}</p>
                    </div>
                  )) : <p className="text-center py-10 text-xs text-gray-400 italic">Tidak ada pengeluaran.</p>}
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDIT SESI */}
      {editTarget && (
        <div className="fixed inset-0 z-150 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <form onSubmit={handleUpdate} className="bg-white dark:bg-kanovi-darker w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 border border-white/10 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black text-kanovi-coffee dark:text-white flex items-center gap-2"><Edit3 className="w-5 h-5 text-kanovi-wood" /> Koreksi Data Audit</h3>
              <button type="button" onClick={() => setEditTarget(null)}><X className="w-6 h-6 text-gray-300" /></button>
            </div>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              <div className="bg-gray-50 dark:bg-black/20 p-4 rounded-2xl">
                <label className="text-[10px] font-black uppercase text-gray-400">Modal Awal Kasir</label>
                <div className="relative mt-1"><span className="absolute left-0 top-1/2 -translate-y-1/2 font-bold text-gray-400">Rp</span><input type="text" value={formatRibuan(editTarget.initialCash)} onChange={e => setEditTarget({...editTarget, initialCash: e.target.value.replace(/\D/g, "")})} className="w-full pl-7 bg-transparent text-xl font-black outline-none dark:text-white" /></div>
              </div>
              <div className="bg-gray-50 dark:bg-black/20 p-4 rounded-2xl">
                <label className="text-[10px] font-black uppercase text-gray-400">Fisik Uang di Laci Kasir</label>
                <div className="relative mt-1"><span className="absolute left-0 top-1/2 -translate-y-1/2 font-bold text-gray-400">Rp</span><input type="text" value={formatRibuan(editTarget.actualCash)} onChange={e => setEditTarget({...editTarget, actualCash: e.target.value.replace(/\D/g, "")})} className="w-full pl-7 bg-transparent text-xl font-black outline-none dark:text-white" /></div>
              </div>
              <div className="p-4 rounded-2xl border-2 border-dashed border-red-200 dark:border-red-900/30 bg-red-50/30 space-y-3">
                <label className="text-[10px] font-black uppercase text-red-500 flex items-center gap-1"><Plus className="w-3 h-3" /> Tambah Catatan Pengeluaran Kasir?</label>
                <div className="space-y-2">
                  <input type="text" placeholder="Nominal" value={formatRibuan(newExpense.amount)} onChange={e => setNewExpense({...newExpense, amount: e.target.value.replace(/\D/g, "")})} className="w-full px-4 py-2 bg-white dark:bg-black/40 rounded-xl text-sm font-bold outline-none dark:text-white" />
                  <input type="text" placeholder="Keterangan Pengeluaran" value={newExpense.desc} onChange={e => setNewExpense({...newExpense, desc: e.target.value})} className="w-full px-4 py-2 bg-white dark:bg-black/40 rounded-xl text-sm outline-none dark:text-white" />
                </div>
              </div>
            </div>
            <button type="submit" disabled={isSubmitting} className="w-full py-5 bg-kanovi-wood hover:bg-kanovi-coffee text-white font-black rounded-2xl shadow-xl transition-all active:scale-95 uppercase tracking-widest text-xs">
              {isSubmitting ? "MEMPROSES..." : "Simpan Koreksi Audit"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function CardSummary({ title, value, icon, isError, desc }: any) {
  return (
    <div className="p-6 bg-white dark:bg-kanovi-darker rounded-2rem border border-kanovi-cream/50 dark:border-white/5 shadow-sm hover:shadow-xl transition-all group">
      <div className="flex justify-between items-start mb-4"><div className="p-3 bg-gray-50 dark:bg-white/5 rounded-2xl group-hover:scale-110 transition-transform">{icon}</div></div>
      <div className={`text-2xl font-black tracking-tight ${isError ? 'text-red-500' : 'text-kanovi-coffee dark:text-white'}`}>Rp {value.toLocaleString('id-ID')}</div>
      <div className="text-[10px] font-black text-gray-400 uppercase mt-1 tracking-widest">{title}</div>
      <p className="text-[9px] text-gray-400 mt-2 font-bold italic opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-tighter">{desc}</p>
    </div>
  );
}