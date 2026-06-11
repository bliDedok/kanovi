export type PaymentMethod = "CASH" | "QRIS";

export type PrepStation = "KITCHEN" | "BAR";

export type PrepStatus =
  | "PENDING"
  | "ACCEPTED"
  | "STARTED"
  | "READY"
  | "SERVED";

export type Category = {
  id: number;
  name: string;
  slug: string;
};

export type Menu = {
  id: number;
  name: string;
  price: number;
  isAvailable: boolean;
  categoryId?: number | null;
  category?: {
    id: number;
    name: string;
    slug: string;
  } | null;
};

export type CartItem = Menu & {
  qty: number;
};

export type OrderDetail = {
  id: number;
  queueNumber?: string;
  orderId: number;
  menuId: number;
  qty: number;
  price: number;
  subtotal: number;
  prepStation: PrepStation;
  prepStatus: PrepStatus;
  acceptedAt?: string | null;
  startedAt?: string | null;
  readyAt?: string | null;
  servedAt?: string | null;
  menu: Menu;
};

export type Order = {
  id: number;
  queueNumber?: string;
  customerName: string | null;
  status: "NEW" | "IN_PROGRESS" | "READY" | "DONE" | "CANCELED";
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

export type StockReason = "SALE" | "SALE_OVERRIDE" | "RESTOCK" | "ADJUSTMENT" | "SPOIL";

export type StockMovement = {
  id: number;
  ingredientId: number;
  qtyChange: number;
  reason: StockReason;
  orderId?: number | null;
  createdAt: string;
  ingredient: Ingredient;
  order?: {
    id: number;
    customerName: string | null;
    totalPrice: number;
    paymentMethod?: PaymentMethod | null;
    paidAt?: string | null;
    orderedAt: string;
  } | null;
};

export type StockMovementSummary = {
  stockIn: number;
  stockOut: number;
  totalMovements: number;
};

export type StockMovementResponse = {
  ok: boolean;
  data: StockMovement[];
  summary: StockMovementSummary;
};

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

export type RecipeItem = {
  id: number;
  ingredientId: number;
  ingredientName: string;
  unit: string;
  amountNeeded: number;
};

export type MenuRecipeResponse = {
  menu: {
    id: number;
    name: string;
    price: number;
    prepStation: PrepStation;
  };
  items: RecipeItem[];
};

export type RecipePayloadItem = {
  ingredientId: number;
  amountNeeded: number;
};

export type EditableRecipeItem = {
  ingredientId: number;
  ingredientName: string;
  unit: string;
  amountNeeded: number;
};

export type MenuWithRecipeFlag = Menu & {
  hasRecipe?: boolean;
  recipeCount?: number;
};

export type ReceiptItem = {
  menuId: number;
  name: string;
  qty: number;
  price: number;
  subtotal: number;
};

export type ReceiptData = {
  orderId: number;
  orderNumber: string;
  queueNumber?: string;
  customerName?: string;
  employeeName: string;
  posName: string;
  storeName: string;
  storeAddress: string;
  items: ReceiptItem[];
  subtotal: number;
  total: number;
  paymentMethod: PaymentMethod;
  paidAmount: number;
  changeAmount: number;
  paidAt: string;
  note: string;
};