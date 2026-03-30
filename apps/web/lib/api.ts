const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3001";

// Fungsi untuk mengambil token dari cookie
export const getToken = (): string | undefined => {
  if (typeof document === "undefined") return undefined; // Mencegah error saat render di server (SSR)
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith("kanovi_token="))
    ?.split("=")[1];
};

// Custom Fetcher yang otomatis memasukkan token
export const fetchApi = async (endpoint: string, options: RequestInit = {}) => {
  const token = getToken();

  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || "Terjadi kesalahan pada server");
  }

  return response.json();
};

// Fungsi-fungsi spesifik API (Bisa dipanggil langsung dari halaman)
export const api = {
  getMenus: () => fetchApi("/api/menus"),

  getQueue: (station: "KITCHEN" | "BAR" = "KITCHEN") =>
    fetchApi(`/api/queue?station=${station}`),

  updateOrderItemStatus: (
    detailId: number,
    status: "ACCEPTED" | "STARTED" | "READY" | "SERVED"
  ) =>
    fetchApi(`/api/queue/items/${detailId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  getHistory: () => fetchApi("/api/orders/history"),

  getIngredients: () => fetchApi("/api/ingredients"),

  getMenuRecipe: (menuId: number) =>
    fetchApi(`/api/menus/${menuId}/recipe`),

  replaceMenuRecipe: (
    menuId: number,
    data: { items: { ingredientId: number; amountNeeded: number }[] }
  ) =>
    fetchApi(`/api/menus/${menuId}/recipe`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  createIngredient: (data: any) =>
    fetchApi("/api/ingredients", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateIngredient: (id: number, data: any) =>
    fetchApi(`/api/ingredients/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  adjustStock: (id: number, qtyChange: number, reason: string) =>
    fetchApi(`/api/ingredients/${id}/adjust`, {
      method: "POST",
      body: JSON.stringify({ qtyChange, reason }),
    }),

createOrder: (data: { 
  origin: string; 
  customerName?: string; 
  branch: string;    
  sessionId: number; 
  items: any[] 
}) =>
  fetchApi("/api/orders", {
    method: "POST",
    body: JSON.stringify(data),
  }),

  checkOrderStock: (orderId: number) =>
    fetchApi(`/api/orders/${orderId}/stock-check`),

  payOrder: (
    orderId: number,
    paymentData: {
      paymentMethod: string;
      overrideStock: boolean;
      overrideNote?: string;
    }
  ) =>
    fetchApi(`/api/orders/${orderId}/pay`, {
      method: "POST",
      body: JSON.stringify(paymentData),
    }),

  getActiveSession: (branch: string) => 
    fetchApi(`/api/finance/sessions/active?branch=${branch}`),

  openSession: (data: { branch: string; openedBy: string; initialCash: number }) =>
    fetchApi("/api/finance/sessions/open", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  closeSession: (data: { sessionId: number; closedBy: string; actualCash: number; note?: string }) =>
    fetchApi("/api/finance/sessions/close", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  createExpense: (data: { sessionId: number; amount: number; description: string; recordedBy: string }) =>
    fetchApi("/api/finance/expenses", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getProfile: () => 
    fetchApi("/api/auth/profile"),

  getFinanceReport: () => 
    fetchApi("/api/finance/report"),

  updateSession: (id: number, data: any) =>
  fetchApi(`/api/finance/sessions/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  }),
};