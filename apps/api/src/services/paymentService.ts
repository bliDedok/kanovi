import { CashPaymentStrategy } from "../strategies/cashPaymentStrategy";
import { QrisPaymentStrategy } from "../strategies/qrisPaymentStrategy";
import { PaymentMethod, PaymentStrategy } from "../strategies/paymentStrategy";

export class PaymentService {
  private getStrategy(method: PaymentMethod): PaymentStrategy {
    switch (method) {
      case "CASH":
        return new CashPaymentStrategy();
      case "QRIS":
        return new QrisPaymentStrategy();
      default:
        throw new Error("Unsupported payment method");
    }
  }

  async processPayment(method: PaymentMethod, amount: number) {
    const strategy = this.getStrategy(method);
    return strategy.pay(amount);
  }
}

export const paymentService = new PaymentService();