"use client";

import { useState } from "react";
import { X, Receipt, Calculator, AlertCircle } from "lucide-react";
import { api } from "../../lib/api";

// Fungsi helper untuk format ribuan Indonesia
const formatRibuan = (value: string) => {
  const angka = value.replace(/\D/g, ""); // Hanya ambil angka (mencegah minus)
  if (!angka) return "";
  return parseInt(angka).toLocaleString("id-ID");
};

// ==========================================
// 1. MODAL PENGELUARAN (EXPENSE)
// ==========================================
export function ExpenseModal({ isOpen, onClose, sessionId }: any) {
    const [amount, setAmount] = useState(""); // Menyimpan angka murni (string)
    const [desc, setDesc] = useState("");
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (loading) return;

    if (!sessionId) {
      alert("Sesi kasir tidak ditemukan. Silakan refresh halaman.");
      return;
    }

    if (!amount || !desc) {
      alert("Isi jumlah dan keterangan!");
      return;
    }

    setLoading(true);

    try {
      await api.createExpense({
        sessionId,
        amount: Number(amount),
        description: desc,
        recordedBy: "Kasir Bertugas",
      });

      alert("Pengeluaran tercatat!");
      setAmount("");
      setDesc("");
      onClose();
    } catch (err: any) {
      const message =
        err?.payload?.message ||
        err?.message ||
        "Gagal menyimpan pengeluaran.";

      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-110 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-white dark:bg-kanovi-darker rounded-3xl shadow-2xl p-6 border border-kanovi-cream/50 dark:border-white/10">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-kanovi-coffee dark:text-white flex items-center gap-2"><Receipt className="w-5 h-5 text-red-500" /> Catat Pengeluaran</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Nominal</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-kanovi-coffee dark:text-white/40">Rp</span>
              <input 
                type="text" 
                value={formatRibuan(amount)} 
                onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))} 
                placeholder="0" 
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-kanovi-dark outline-none focus:ring-2 focus:ring-red-500 font-bold dark:text-white" 
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Keterangan</label>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Contoh: Beli es batu" className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-kanovi-dark outline-none focus:ring-2 focus:ring-red-500 dark:text-white h-24" />
          </div>
          <button type="submit" disabled={loading} className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl transition-all">{loading ? "Menyimpan..." : "Simpan Pengeluaran"}</button>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// 2. MODAL CLOSING (TUTUP KASIR)
// ==========================================
export function ClosingModal({ isOpen, onClose, sessionId, onClosingSuccess }: any) {
  const [actualCash, setActualCash] = useState(""); // Menyimpan angka murni
  const [closedBy, setClosedBy] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (loading) return;

  if (!sessionId) {
    alert("Sesi kasir tidak ditemukan. Silakan refresh halaman.");
    return;
  }

  if (!actualCash || !closedBy) {
    alert("Isi nama penanggung jawab dan total uang fisik!");
    return;
  }

  setLoading(true);

  try {
    const result = await api.closeSession({
      sessionId,
      closedBy,
      actualCash: Number(actualCash),
      note,
    });

    console.log("CLOSING RESULT:", result);

    const closingData = result?.session || result?.data || result?.closing || result;
    const closingSummary = result?.summary || closingData?.summary || {};

    console.log("CLOSING DATA:", closingData);
    console.log("CLOSING SUMMARY:", closingSummary);

    try {
      const closingPrintPayload = {
        sessionId: closingData?.id || closingData?.sessionId || sessionId,

        openedBy: closingData?.openedBy,
        closedBy: closingData?.closedBy || closedBy,
        branch: closingData?.branch || "PUSAT",
        openedAt: closingData?.openedAt,
        closedAt: closingData?.closedAt,

        openingCash:
          closingSummary?.openingCash ??
          closingData?.openingCash ??
          closingData?.initialCash ??
          0,

        cashSales:
          closingSummary?.cashSales ??
          closingData?.cashSales ??
          0,

        qrisSales:
          closingSummary?.qrisSales ??
          closingData?.qrisSales ??
          0,

        expenses:
          closingSummary?.expenses ??
          closingData?.expenses ??
          0,

        expectedCash:
          closingSummary?.expectedCash ??
          closingData?.expectedCash ??
          0,

        actualCash:
          closingSummary?.actualCash ??
          closingData?.actualCash ??
          Number(actualCash),

        difference:
          closingSummary?.difference ??
          closingData?.difference ??
          0,

        totalOrders:
          closingSummary?.totalOrders ??
          closingData?.totalOrders ??
          0,

        totalVoidOrders:
          closingSummary?.totalVoidOrders ??
          closingData?.totalVoidOrders ??
          0,

        grossSales:
          closingSummary?.grossSales ??
          closingData?.grossSales ??
          0,

        netSales:
          closingSummary?.netSales ??
          closingData?.netSales ??
          0,
      };

      console.log("CLOSING PRINT PAYLOAD:", closingPrintPayload);

      await api.printClosingReceipt(closingPrintPayload);

      alert("Sesi kasir berhasil ditutup dan rekap closing berhasil dicetak.");
    } catch (printError) {
      console.error("Gagal print struk closing:", printError);
      alert("Sesi kasir berhasil ditutup, tetapi struk closing gagal dicetak.");
    }

    setActualCash("");
    setClosedBy("");
    setNote("");

    onClosingSuccess();
  } catch (err: any) {
    const message =
      err?.payload?.message ||
      err?.message ||
      "Gagal menutup sesi kasir.";

    if (
      message.toLowerCase().includes("sudah ditutup") ||
      err?.status === 409 ||
      err?.code === 409
    ) {
      alert("Sesi kasir sudah ditutup. Anda akan diarahkan ke halaman login.");

      setActualCash("");
      setClosedBy("");
      setNote("");

      onClosingSuccess();
      return;
    }

    alert(message);
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="fixed inset-0 z-110 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-white dark:bg-kanovi-darker rounded-3xl shadow-2xl p-6 border border-kanovi-cream/50 dark:border-white/10 text-center">
        <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4"><Calculator className="w-8 h-8 text-yellow-600" /></div>
        <h3 className="text-xl font-bold text-kanovi-coffee dark:text-white">Closing Hari Ini</h3>
        <p className="text-xs text-gray-500 mb-6 px-4">Hitung semua uang fisik yang ada di laci saat ini.</p>
        
        <form onSubmit={handleSubmit} className="text-left space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Penyusun Laporan (Closing By)</label>
            <select value={closedBy} onChange={(e) => setClosedBy(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-kanovi-dark outline-none focus:ring-2 focus:ring-kanovi-wood dark:text-white text-sm">
               <option value="">-- Pilih Nama --</option>
               <option value="Diah">Diah</option>
               <option value="Nata">Nata</option>
               <option value="Dimas">Dimas (Owner)</option>
               <option value="Novi">Novi (Owner)</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Total Uang Fisik di Laci</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-kanovi-coffee dark:text-white/40">Rp</span>
              <input 
                type="text" 
                value={formatRibuan(actualCash)} 
                onChange={(e) => setActualCash(e.target.value.replace(/\D/g, ""))} 
                placeholder="0" 
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-kanovi-dark text-xl font-bold outline-none focus:ring-2 focus:ring-kanovi-wood dark:text-white" 
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Catatan Selisih (Opsional)</label>
            <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Cth: Selisih 2rb" className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-kanovi-dark text-sm outline-none dark:text-white" />
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-xl flex gap-2 border border-amber-200 dark:border-amber-900/30">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[10px] text-amber-800 dark:text-amber-200 italic leading-tight">Sesi akan langsung terkunci setelah ditutup. Pastikan semua orderan sudah lunas.</p>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-kanovi-coffee hover:bg-black text-white font-bold rounded-2xl transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Memproses..." : "TUTUP KASIR & SIMPAN"}
          </button>
          <button type="button" onClick={onClose} className="w-full py-2 text-gray-400 text-sm font-semibold">Batal</button>
        </form>
      </div>
    </div>
  );
}