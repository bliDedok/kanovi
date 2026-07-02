export type ReceiptItem = {
  name: string;
  qty: number;
  price: number;
  subtotal: number;
};

export type ReceiptPayload = {
  storeName?: string;
  storeAddress?: string;
  employeeName?: string;
  posName?: string;
  customerName?: string | null;
  queueNumber?: string;
  paymentMethod?: "CASH" | "QRIS" | string;
  paidAmount?: number;
  changeAmount?: number;
  total?: number;
  paidAt?: string;
  items?: ReceiptItem[];
};

export type ClosingReceiptPayload = {
  sessionId?: number | null;
  openedBy?: string | null;
  closedBy?: string | null;
  branch?: string | null;
  openedAt?: string | null;
  closedAt?: string | null;

  openingCash?: number;
  cashSales?: number;
  qrisSales?: number;
  expenses?: number;
  expectedCash?: number;
  actualCash?: number;
  difference?: number;

  totalOrders?: number;
  totalVoidOrders?: number;
  grossSales?: number;
  netSales?: number;
};