import { PaymentStrategy } from "./paymentStrategy";

export class CashPaymentStrategy implements PaymentStrategy {
  async pay(amount: number) {
    if (amount <= 0) {
      throw new Error("Invalid payment amount");
    }

    return {
      method: "CASH" as const,
      status: "PAID" as const,
    };
  }
}