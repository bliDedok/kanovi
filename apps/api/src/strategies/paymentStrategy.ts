export type PaymentMethod = "CASH" | "QRIS";

export type PaymentResult = {
  method: PaymentMethod;
  status: "PAID";
};

export interface PaymentStrategy {
  pay(amount: number): Promise<PaymentResult>;
}