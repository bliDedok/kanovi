import { PaymentStrategy } from "./paymentStrategy";

export class QrisPaymentStrategy implements PaymentStrategy {
  async pay(amount: number) {
    if (amount <= 0) {
      throw new Error("Invalid payment amount");
    }

    return {
      method: "QRIS" as const,
      status: "PAID" as const,
    };
  }
}