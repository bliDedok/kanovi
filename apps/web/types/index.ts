export type PaymentMethod = "CASH" | "QRIS";

export type Category = {
  id: number;
  name: string;
  slug: string;
};

export type Menu = {
  id: number;
  name: string;
  price: number;
  categoryId?: number | null;
  category?: Category | null;
};

export type CartItem = Menu & {
  qty: number;
};

export type OrderDetail = {
  id: number;
  qty: number;
  price: number;
  subtotal: number;
  menu: Menu;
};

export type Order = {
  id: number;
  customerName: string | null;
  status: "NEW" | "IN_PROGRESS" | "READY" | "DONE";
  paymentStatus: "UNPAID" | "PAID" | "VOID";
  paymentMethod?: PaymentMethod | null;
  totalPrice: number;
  orderedAt: string;
  details: OrderDetail[];
};

export type ShortageItem = {
  ingredientId: number;
  ingredientName: string;
  unit: string;
  stock: number;
  need: number;
  shortBy: number;
};

export type JwtPayload = {
  userId?: number;
  id?: number;
  role?: string;
  exp?: number;
};

export type StockReason = "RESTOCK" | "ADJUSTMENT" | "SPOIL";

export type Ingredient = {
  id: number;
  name: string;
  stock: number;
  unit: string;
  minStock: number;
  isLowStock?: boolean;
  createdAt?: string;
  updatedAt?: string;
};