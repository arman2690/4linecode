const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  // Get token if stored, or fallback to demo-token so requests never fail authorization
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("receiptiq_token") || "demo-token";
    headers.set("Authorization", `Bearer ${token}`);

    const aiKey = localStorage.getItem("receiptiq_ai_key");
    if (aiKey) {
      headers.set("X-AI-Key", aiKey.trim());
    }
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = "An error occurred";
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errorDetail;
    } catch {
      errorDetail = response.statusText;
    }
    throw new Error(errorDetail);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export const api = {
  // Health
  getHealth: () => fetchWithAuth("/health"),

  // Receipts
  uploadReceipt: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return fetchWithAuth("/receipts/upload", {
      method: "POST",
      body: formData,
    });
  },

  createReceipt: (data: any) =>
    fetchWithAuth("/receipts", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getReceipts: (search?: string, category?: string) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (category) params.set("category", category);
    return fetchWithAuth(`/receipts?${params.toString()}`);
  },

  getReceipt: (id: string) => fetchWithAuth(`/receipts/${id}`),

  updateReceipt: (id: string, data: any) =>
    fetchWithAuth(`/receipts/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  deleteReceipt: (id: string) =>
    fetchWithAuth(`/receipts/${id}`, {
      method: "DELETE",
    }),

  // Analytics
  getSummary: (currency: string = "INR") =>
    fetchWithAuth(`/analytics/summary?currency=${currency}`),

  getCategories: () => fetchWithAuth("/analytics/categories"),

  getSpendingTimeline: (days: number = 30) =>
    fetchWithAuth(`/analytics/spending?days=${days}`),

  getMonthlySpending: (months: number = 6) =>
    fetchWithAuth(`/analytics/monthly?months=${months}`),

  getPriceIntelligence: () => fetchWithAuth("/analytics/price-intelligence"),

  // Warranties
  getWarranties: () => fetchWithAuth("/warranties"),

  createWarranty: (data: any) =>
    fetchWithAuth("/warranties", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  deleteWarranty: (id: string) =>
    fetchWithAuth(`/warranties/${id}`, {
      method: "DELETE",
    }),

  // AI Assistant
  askAssistant: (message: string) =>
    fetchWithAuth("/assistant/chat", {
      method: "POST",
      body: JSON.stringify({ message }),
    }),
};
