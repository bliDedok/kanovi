import { LpPrinterAdapter } from "../adapters/printerAdapter";
import { ReceiptFactory } from "../factories/receiptFactory";
import type {
  ClosingReceiptPayload,
  ReceiptPayload,
} from "../receipts/receiptTypes";

export type { ClosingReceiptPayload, ReceiptItem, ReceiptPayload } from "../receipts/receiptTypes";

const printerName = process.env.THERMAL_PRINTER_NAME || "GEZHI_micro_printer";
const printerAdapter = new LpPrinterAdapter(printerName);

export class PrinterService {
  getPrinterName() {
    return printerAdapter.getPrinterName();
  }

  async testPrint() {
    const receiptText = ReceiptFactory.createReceiptText("TEST", undefined, {
      printerName,
    });

    await printerAdapter.print(receiptText);

    return {
      kind: "SUCCESS" as const,
    };
  }

  async printReceipt(receipt: ReceiptPayload) {
    if (!receipt?.items || receipt.items.length === 0) {
      return {
        kind: "EMPTY_ITEMS" as const,
      };
    }

    const receiptText = ReceiptFactory.createReceiptText("CUSTOMER", receipt);

    await printerAdapter.print(receiptText);

    return {
      kind: "SUCCESS" as const,
    };
  }

  async printKitchenReceipt(receipt: ReceiptPayload) {
    if (!receipt?.items || receipt.items.length === 0) {
      return {
        kind: "EMPTY_ITEMS" as const,
      };
    }

    const receiptText = ReceiptFactory.createReceiptText("KITCHEN", receipt);

    await printerAdapter.print(receiptText);

    return {
      kind: "SUCCESS" as const,
    };
  }

  async printClosingReceipt(closing: ClosingReceiptPayload) {
    const receiptText = ReceiptFactory.createReceiptText("CLOSING", closing);

    await printerAdapter.print(receiptText);

    return {
      kind: "SUCCESS" as const,
    };
  }
}

export const printerService = new PrinterService();