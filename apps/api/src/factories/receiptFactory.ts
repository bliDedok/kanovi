import { buildClosingReceiptText } from "../receipts/closingReceiptBuilder";
import { buildCustomerReceiptText } from "../receipts/customerReceiptBuilder";
import { buildKitchenReceiptText } from "../receipts/kitchenReceiptBuilder";
import { buildTestPrintText } from "../receipts/testPrintBuilder";
import type {
  ClosingReceiptPayload,
  ReceiptPayload,
} from "../receipts/receiptTypes";

export type ReceiptType = "TEST" | "CUSTOMER" | "KITCHEN" | "CLOSING";

export class ReceiptFactory {
  static createReceiptText(
    type: ReceiptType,
    payload?: ReceiptPayload | ClosingReceiptPayload,
    options?: {
      printerName?: string;
    }
  ) {
    switch (type) {
      case "TEST":
        return buildTestPrintText(options?.printerName || "Unknown Printer");

      case "CUSTOMER":
        if (!payload) {
          throw new Error("Customer receipt payload wajib diisi");
        }

        return buildCustomerReceiptText(payload as ReceiptPayload);

      case "KITCHEN":
        if (!payload) {
          throw new Error("Kitchen receipt payload wajib diisi");
        }

        return buildKitchenReceiptText(payload as ReceiptPayload);

      case "CLOSING":
        if (!payload) {
          throw new Error("Closing receipt payload wajib diisi");
        }

        return buildClosingReceiptText(payload as ClosingReceiptPayload);

      default:
        throw new Error("Jenis receipt tidak didukung");
    }
  }
}