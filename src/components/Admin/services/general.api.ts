import { api, ADMIN_BASE, clearToken, setToken } from "./client";
import type { 
  AnalyticsSummary, DailyStat, TopQuery, FeedbackStat, 
  AuditResponse, QueryRow, PromptVariant, AdminUser, AdminInvitation, Role, AdminStatus 
} from "../types/api.types";

export const getLoginUrl = async (inviteToken?: string) => 
  (await api<{ url: string }>(`${ADMIN_BASE}/auth/login${inviteToken ? `?invite_token=${encodeURIComponent(inviteToken)}` : ""}`)).url;

export const logout = async (): Promise<void> => {
  try {
    await api<unknown>(`${ADMIN_BASE}/auth/logout`, { method: "POST" });
  } finally {
    clearToken();
  }
};

export const fetchMe = () => api<AdminUser>(`${ADMIN_BASE}/me`);

export const fetchSummary = (days = 30) => api<AnalyticsSummary>(`${ADMIN_BASE}/analytics/summary?days=${days}`);
export const fetchDaily = (days = 30) => api<DailyStat[]>(`${ADMIN_BASE}/analytics/daily?days=${days}`);
export const fetchTopQueries = (days = 30, limit = 10) => api<TopQuery[]>(`${ADMIN_BASE}/analytics/top-queries?days=${days}&limit=${limit}`);
export const fetchFeedback = (days = 30) => api<FeedbackStat>(`${ADMIN_BASE}/analytics/feedback?days=${days}`);

export const fetchAudit = (offset = 0, limit = 5) => api<AuditResponse>(`${ADMIN_BASE}/audit?offset=${offset}&limit=${limit}`);

export const fetchQueries = (days = 30, limit = 50) => api<QueryRow[]>(`${ADMIN_BASE}/queries?days=${days}&limit=${limit}`);

export const fetchPrompts = () => api<PromptVariant[]>(`${ADMIN_BASE}/prompts`);
export const createPrompt = (prompt: Partial<PromptVariant>) => api<unknown>(`${ADMIN_BASE}/prompts`, {
  method: "POST",
  body: JSON.stringify(prompt),
});
export const togglePromptActive = (id: number, isActive: boolean) => api<unknown>(`${ADMIN_BASE}/prompts/${id}/active`, {
  method: "PATCH",
  body: JSON.stringify({ is_active: isActive }),
});
export const updatePrompt = (id: number, promptText: string) => api<unknown>(`${ADMIN_BASE}/prompts/${id}`, {
  method: "PATCH",
  body: JSON.stringify({ prompt_text: promptText }),
});
export const deletePrompt = (id: number) => api<unknown>(`${ADMIN_BASE}/prompts/${id}`, {
  method: "DELETE",
});

export const fetchAdmins = () => api<AdminUser[]>(`${ADMIN_BASE}/admins`);

export const updateAdminRole = (email: string, role: Role) => api<AdminUser>(`${ADMIN_BASE}/admins/${encodeURIComponent(email)}/role`, {
  method: "PATCH",
  body: JSON.stringify({ role }),
});

export const updateAdminStatus = (email: string, status: AdminStatus) => api<AdminUser>(`${ADMIN_BASE}/admins/${encodeURIComponent(email)}/status`, {
  method: "PATCH",
  body: JSON.stringify({ status }),
});

export const removeAdmin = (email: string) => api<{ status: string; email: string }>(`${ADMIN_BASE}/admins/${encodeURIComponent(email)}`, {
  method: "DELETE",
});

export const fetchInvitations = () => api<AdminInvitation[]>(`${ADMIN_BASE}/invitations`);

export const sendInvitation = (email: string, role: Role) => api<{ invitation: AdminInvitation; invite_url?: string }>(`${ADMIN_BASE}/invitations`, {
  method: "POST",
  body: JSON.stringify({ email, role }),
});

export const resendInvitation = (id: string) => api<{ status: string; invite_url?: string }>(`${ADMIN_BASE}/invitations/${id}/resend`, {
  method: "POST",
});

export const revokeInvitation = (id: string) => api<{ status: string; id: string }>(`${ADMIN_BASE}/invitations/${id}/revoke`, {
  method: "POST",
});

export const validateInviteToken = (token: string) => api<{ valid: boolean; email: string; role: Role; expires_at: string }>(`/api/v1/invitations/validate?token=${encodeURIComponent(token)}`);

export const acceptInvite = async (token: string, password?: string): Promise<{ token: string; user: AdminUser }> => {
  const res = await api<{ token: string; user: AdminUser }>("/api/v1/invitations/accept", {
    method: "POST",
    body: JSON.stringify({ token, password }),
  });
  if (res.token) {
    setToken(res.token);
  }
  return res;
};

