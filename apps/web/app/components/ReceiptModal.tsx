"use client";

import { Printer, ReceiptText, X } from "lucide-react";
import type { ReceiptData } from "../../types";
import { formatCurrency, formatReceiptDate } from "../../lib/receipt";

type ReceiptModalProps = {
  receipt: ReceiptData;
  onClose: () => void;
};

export default function ReceiptModal({ receipt, onClose }: ReceiptModalProps) {
  const logoPath = "/images/kanovi_Fix.png";

  const handlePrintPos = () => {
    const printWindow = window.open("", "_blank", "width=420,height=700");

    if (!printWindow) {
      alert("Popup print diblokir browser. Izinkan popup untuk mencetak struk.");
      return;
    }

    const itemsHtml = receipt.items
      .map(
        (item) => `
          <div class="item">
            <div class="item-row">
              <strong>${item.name} (UND)</strong>
              <span>${formatCurrency(item.subtotal)}</span>
            </div>
            <div class="muted">${item.qty} x ${formatCurrency(item.price)}</div>
          </div>
        `
      )
      .join("");

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Kanovi POS Receipt</title>
          <style>
            @page {
              size: 80mm auto;
              margin: 0;
            }

            * {
              box-sizing: border-box;
            }

            html,
            body {
              width: 80mm;
              margin: 0;
              padding: 0;
              background: #ffffff;
              color: #000000;
              font-family: Arial, sans-serif;
            }

            body {
              padding: 4mm;
            }

            .receipt {
              width: 72mm;
              max-width: 72mm;
              background: #ffffff;
              color: #000000;
              font-size: 11px;
              line-height: 1.45;
            }

            .center {
              text-align: center;
            }

            .logo {
              width: 22mm;
              height: 22mm;
              object-fit: contain;
              margin-bottom: 2mm;
            }

            .store-name {
              font-size: 14px;
              font-weight: 700;
              margin-bottom: 2mm;
            }

            .address {
              font-size: 10px;
              color: #444;
              line-height: 1.45;
            }

            .section-title {
              margin-top: 4mm;
              font-size: 12px;
              font-weight: 700;
              letter-spacing: 0.5px;
            }

            .line {
              border-top: 1px solid #000;
              margin: 3mm 0;
            }

            .row,
            .item-row,
            .total-row {
              display: flex;
              justify-content: space-between;
              gap: 8px;
            }

            .item {
              margin-bottom: 3mm;
            }

            .muted {
              color: #555;
              margin-top: 1mm;
            }

            .total-row {
              font-size: 18px;
              font-weight: 900;
              margin-bottom: 2mm;
            }

            .footer {
              text-align: center;
              font-size: 11px;
              line-height: 1.5;
            }

            .bottom {
              display: flex;
              justify-content: space-between;
              margin-top: 5mm;
              font-size: 11px;
            }
          </style>
        </head>

        <body>
          <div class="receipt">
            <div class="center">
              <img src="${logoPath}" class="logo" />
              <div class="store-name">${receipt.storeName}</div>
              <div class="address">${receipt.storeAddress}</div>
              <div class="section-title">KANOVI ESCAPE</div>
            </div>

            <div style="margin-top: 5mm;">
              <div class="row">
                <span>Employee:</span>
                <span>${receipt.employeeName}</span>
              </div>
              <div class="row">
                <span>POS:</span>
                <span>${receipt.posName}</span>
              </div>
            </div>

            <div class="line"></div>

            ${itemsHtml}

            <div class="line"></div>

            <div class="total-row">
              <span>Total</span>
              <span>${formatCurrency(receipt.total)}</span>
            </div>

            <div class="row">
              <span>${receipt.paymentMethod === "CASH" ? "Cash" : "QRIS"}</span>
              <span>${formatCurrency(receipt.paidAmount)}</span>
            </div>

            ${
              receipt.paymentMethod === "CASH"
                ? `
                  <div class="row">
                    <span>Change</span>
                    <span>${formatCurrency(receipt.changeAmount)}</span>
                  </div>
                `
                : ""
            }

            <div class="line"></div>

            <div class="footer">
              <div>Thanks for choosing Kanovi Escape</div>
              <div>Get the latest updates on promos, seasonal menus, and events by following us on Instagram</div>
              <div>@kanovi escape</div>
            </div>

            <div class="bottom">
              <span>${formatReceiptDate(receipt.paidAt)}</span>
              <span>${receipt.queueNumber}</span>
            </div>
          </div>

          <script>
            window.onload = function () {
              setTimeout(function () {
                window.print();
              }, 300);
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
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
                <img
                  src={logoPath}
                  alt="Kanovi Logo"
                  className="h-50 w-50 object-contain"
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