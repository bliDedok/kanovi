"use client";

import { Printer, ReceiptText, X } from "lucide-react";
import type { ReceiptData } from "../../types";
import { formatCurrency, formatReceiptDate } from "../../lib/receipt";
import { api } from "../../lib/api";
import Image from "next/image";

type ReceiptModalProps = {
  receipt: ReceiptData;
  onClose: () => void;
};

export default function ReceiptModal({ receipt, onClose }: ReceiptModalProps) {
  const logoPath = "/images/kanovi_Fix.png";

  const handlePrintPos = async () => {
    try {
      await api.directPrintReceipt(receipt);
      alert("Struk berhasil dikirim ke printer.");
    } catch (error: any) {
      alert(
        error?.message ||
          "Direct print gagal. Pastikan printer GEZHI/Woya tersambung USB."
      );
    }
  };

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-kanovi-paper p-5 shadow-2xl dark:bg-kanovi-darker">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-kanovi-coffee dark:text-kanovi-bone">
              Preview Struk POS
            </h2>
            <p className="text-xs text-kanovi-coffee/70 dark:text-kanovi-bone/70">
              Transaksi berhasil diproses.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-kanovi-bone p-2 text-kanovi-coffee transition hover:bg-kanovi-cream dark:bg-kanovi-dark dark:text-kanovi-bone"
            aria-label="Tutup struk"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex justify-center">
          <div className="w-[80mm] max-w-[80mm] rounded-2xl bg-white p-4 text-black shadow-inner">
            <div className="text-center">
              <div className="mx-auto mb-3 flex justify-center">
                <Image
                  src={logoPath}
                  alt="Preview"
                  width={300}
                  height={300}
                  className="..."
                />
              </div>

              <h1 className="text-sm font-bold">{receipt.storeName}</h1>

              <p className="mx-auto mt-2 max-w-xs text-[10px] leading-relaxed text-black/70">
                {receipt.storeAddress}
              </p>

              <p className="mt-4 text-xs font-semibold uppercase tracking-wide">
                KANOVI ESCAPE
              </p>
            </div>

            <div className="mt-5 space-y-1 text-xs">
              <div className="flex justify-between gap-4">
                <span>Employee:</span>
                <span>{receipt.employeeName}</span>
              </div>

              <div className="flex justify-between gap-4">
                <span>POS:</span>
                <span>{receipt.posName}</span>
              </div>
            </div>

            <div className="my-3 border-t border-black" />

            <div className="space-y-4 text-xs">
              {receipt.items.map((item) => (
                <div key={item.menuId}>
                  <div className="flex justify-between gap-4">
                    <span className="font-medium">{item.name} (UND)</span>
                    <span>{formatCurrency(item.subtotal)}</span>
                  </div>

                  <p className="mt-1 text-black/70">
                    {item.qty} x {formatCurrency(item.price)}
                  </p>
                </div>
              ))}
            </div>

            <div className="my-3 border-t border-black" />

            <div className="space-y-2">
              <div className="flex justify-between text-lg font-black">
                <span>Total</span>
                <span>{formatCurrency(receipt.total)}</span>
              </div>

              <div className="flex justify-between text-xs">
                <span>
                  {receipt.paymentMethod === "CASH" ? "Cash" : "QRIS"}
                </span>
                <span>{formatCurrency(receipt.paidAmount)}</span>
              </div>

              {receipt.paymentMethod === "CASH" && (
                <div className="flex justify-between text-xs">
                  <span>Change</span>
                  <span>{formatCurrency(receipt.changeAmount)}</span>
                </div>
              )}
            </div>

            <div className="my-3 border-t border-black" />

            <div className="text-center text-xs leading-relaxed">
              <p>Thanks for choosing Kanovi Escape</p>
              <p>
                Get the latest updates on promos, seasonal menus, and events by
                following us on Instagram
              </p>
              <p>@kanovi escape</p>
            </div>

            <div className="mt-5 flex justify-between text-xs">
              <span>{formatReceiptDate(receipt.paidAt)}</span>
              <span>{receipt.queueNumber}</span>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={handlePrintPos}
            className="flex items-center justify-center gap-2 rounded-xl bg-kanovi-wood py-3 text-sm font-bold text-white transition hover:bg-kanovi-coffee"
          >
            <ReceiptText size={17} />
            Print POS
          </button>

          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center gap-2 rounded-xl bg-kanovi-bone py-3 text-sm font-bold text-kanovi-coffee transition hover:bg-kanovi-cream dark:bg-kanovi-dark dark:text-kanovi-bone"
          >
            <Printer size={17} />
            Pesanan Baru
          </button>
        </div>
      </div>
    </div>
  );
}