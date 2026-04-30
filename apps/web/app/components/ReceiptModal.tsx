"use client";

import { useEffect, useRef, useState } from "react";
import { Printer, ReceiptText, X } from "lucide-react";
import type { ReceiptData } from "../../types";
import { formatCurrency, formatReceiptDate } from "../../lib/receipt";

type PrintMode = "POS" | "KITCHEN";

type ReceiptModalProps = {
  receipt: ReceiptData;
  onClose: () => void;
};

export default function ReceiptModal({ receipt, onClose }: ReceiptModalProps) {
  const [printMode, setPrintMode] = useState<PrintMode>("POS");
  const hasAutoPrintedKitchen = useRef(false);

  useEffect(() => {
    if (hasAutoPrintedKitchen.current) return;

    hasAutoPrintedKitchen.current = true;
    setPrintMode("KITCHEN");

    const printTimer = window.setTimeout(() => {
      window.print();
    }, 300);

    const restorePosPrintMode = () => {
      setPrintMode("POS");
    };

    window.addEventListener("afterprint", restorePosPrintMode);

    return () => {
      window.clearTimeout(printTimer);
      window.removeEventListener("afterprint", restorePosPrintMode);
    };
  }, []);

  const handlePrintPos = () => {
    setPrintMode("POS");

    window.setTimeout(() => {
      window.print();
    }, 100);
  };

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm print:static print:bg-white print:p-0">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-kanovi-paper p-5 shadow-2xl dark:bg-kanovi-darker print:max-h-none print:max-w-none print:overflow-visible print:rounded-none print:bg-white print:p-0 print:shadow-none">
        <div className="mb-4 flex items-center justify-between print:hidden">
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

        <div className="flex justify-center print:block">
          <div
            id="pos-receipt-print-area"
            data-print-active={printMode === "POS"}
            className="receipt-print-target receipt-paper w-67.5 rounded-2xl bg-white p-4 text-black shadow-inner print:w-[80mm] print:rounded-none print:p-0 print:shadow-none"
          >
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center text-2xl font-black leading-none tracking-tighter">
                <div className="-rotate-90">KANOVI</div>
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
                <span>{receipt.paymentMethod === "CASH" ? "Cash" : "QRIS"}</span>
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
                Get the latest updates on promos, seasonal menus, and events by following us on
                Instagram
              </p>
              <p>@kanovi escape</p>
            </div>

            <div className="mt-5 flex justify-between text-xs">
              <span>{formatReceiptDate(receipt.paidAt)}</span>
              <span>{receipt.queueNumber}</span>
            </div>
          </div>

          <div
            id="kitchen-receipt-print-area"
            data-print-active={printMode === "KITCHEN"}
            className="receipt-print-target hidden w-67.5 rounded-2xl bg-white p-4 text-black shadow-inner print:block print:w-[80mm] print:rounded-none print:p-0 print:shadow-none"
          >
            <div className="space-y-8">
              {receipt.items.map((item, index) => (
                <div key={item.menuId} className="kitchen-ticket break-inside-avoid">
                  <h1 className="text-center text-3xl font-black tracking-wide">
                    {receipt.queueNumber}
                  </h1>

                  <div className="mt-5 space-y-2 text-base">
                    <p>{formatReceiptDate(receipt.paidAt)}</p>
                    <p>
                      {receipt.employeeName}, {receipt.posName}
                    </p>
                  </div>

                  <div className="my-4 border-t border-black" />

                  <p className="text-2xl font-black">
                    {item.qty} x {item.name}
                  </p>

                  <div className="my-4 border-t border-black" />

                  {receipt.customerName && (
                    <p className="text-sm font-semibold">
                      Customer: {receipt.customerName}
                    </p>
                  )}

                  {index < receipt.items.length - 1 && (
                    <div className="mt-8 border-b border-dashed border-black pb-8 print:break-after-page" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 print:hidden">
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