import type { CartItem, PaymentMethod, ReceiptData, ReceiptItem } from "../types";

type BuildReceiptParams = {
  orderId: number;
  customerName: string;
  cart: CartItem[];
  paymentMethod: PaymentMethod;
  paidAmount: number;
  changeAmount: number;
  employeeName?: string;
  posName?: string;
};

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

export const formatReceiptDate = (date: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "numeric",
    day: "numeric",
    year: "2-digit",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(date));

export const buildReceiptData = ({
  orderId,
  customerName,
  cart,
  paymentMethod,
  paidAmount,
  changeAmount,
  employeeName = "Owner",
  posName = "POS 1",
}: BuildReceiptParams): ReceiptData => {
  const items: ReceiptItem[] = cart.map((item) => ({
    menuId: item.id,
    name: item.name,
    qty: item.qty,
    price: item.price,
    subtotal: item.price * item.qty,
  }));

  const total = items.reduce((sum, item) => sum + item.subtotal, 0);
  const queueNumber = `#01-${String(orderId).padStart(3, "0")}`;

  return {
    orderId,
    orderNumber: `#${orderId}`,
    queueNumber,
    customerName: customerName.trim() || undefined,
    employeeName,
    posName,
    storeName: "Kanovi Escape",
    storeAddress:
      "Universitas Pendidikan Nasional (UNDIKNAS), Masuk Kedalam Area Parkir Undiknas, Jl. Bedugul No.39, Sidakarya, Denpasar Selatan, Kota Denpasar, Bali, 80224",
    items,
    subtotal: total,
    total,
    paymentMethod,
    paidAmount,
    changeAmount,
    paidAt: new Date().toISOString(),
    note: "",
  };
};