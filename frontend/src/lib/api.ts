const API_URL = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:5000" : "https://reachinbox-email-scheduler-production-8739.up.railway.app"))
  .replace(/\/$/, "")
  .replace(/\/api$/, "");
const API_PREFIX = "/api";

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("reachinbox_token");
  let response: Response;
  try {
    response = await fetch(`${API_URL}${API_PREFIX}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });
  } catch {
    throw new Error("Unable to connect to the server. Please make sure the backend is running.");
  }

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload?.message || "Request failed");
  }

  return payload?.data ?? payload;
}

export type DashboardStats = { total: number; sent: number; scheduled: number; pending: number; failed: number; cancelled: number };
export type EmailRecord = { id: string; to: string; subject: string; body: string; status: "SENT" | "SCHEDULED" | "PENDING" | "PROCESSING" | "FAILED" | "CANCELLED"; scheduledAt?: string | null; messageId?: string | null; createdAt: string; updatedAt?: string; user?: { id: string; name: string; email: string } };

export const fetchDashboardStats = () => api<DashboardStats>("/dashboard/stats");
export const fetchRecentEmails = () => api<EmailRecord[]>("/dashboard/recent");
export const fetchEmails = () => api<EmailRecord[]>("/emails");
export const createEmail = (payload: Record<string, unknown>) => api<EmailRecord>("/emails", { method: "POST", body: JSON.stringify(payload) });
export const cancelEmail = (id: string) => api<EmailRecord>(`/emails/${id}/cancel`, { method: "POST" });
export const deleteEmail = (id: string) => api<EmailRecord>(`/emails/${id}`, { method: "DELETE" });
export type AuthUser = { id: string; name: string; email: string; role: string };
export const authLogin = (payload: { email: string; password: string }) => api<{ user: AuthUser; token: string }>("/auth/login", { method: "POST", body: JSON.stringify(payload) });
export const authRegister = (payload: { name: string; email: string; password: string }) => api<{ user: AuthUser; token: string }>("/auth/register", { method: "POST", body: JSON.stringify(payload) });
export const authLogout = () => api<{ message: string }>("/auth/logout", { method: "POST" });
export const authMe = () => api<AuthUser>("/auth/me");
export const updateProfile = (payload: { name: string; email: string }) => api<AuthUser>("/auth/me", { method: "PUT", body: JSON.stringify(payload) });
