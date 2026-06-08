/**
 * @module Admin/api
 * Admin panel API layer. All requests attach the in-memory JWT access token.
 * On 401, automatically attempts a silent token refresh before retrying.
 * Base URL: PUBLIC_API_URL env. Admin path: PUBLIC_ADMIN_PATH env.
 */
const API_BASE = import.meta.env.PUBLIC_API_URL ?? "http://localhost:8080";
const ADMIN_PATH = import.meta.env.PUBLIC_ADMIN_PATH ?? "panel";
const ADMIN_BASE = `/admin-${ADMIN_PATH}`;

/** Overview card data returned by GET /analytics/summary. */
export interface AnalyticsSummary {
  total_queries: number;
  blocked_queries: number;
  positive_feedback: number;
  negative_feedback: number;
  avg_response_ms: number;
}

/** One day of usage data from GET /analytics/daily. */
export interface DailyStat {
  date: string;
  total_queries: number;
  blocked_queries: number;
  avg_response_ms: number;
  positive_feedback: number;
  negative_feedback: number;
}

/** A frequently asked query from GET /analytics/top-queries. */
export interface TopQuery {
  query_text: string;
  count: number;
  language: string;
  last_seen: string;
}

/** Feedback ratio statistics from GET /analytics/feedback. */
export interface FeedbackStat {
  total: number;
  positive: number;
  negative: number;
  ratio: number;
}

/** Knowledge base document record from GET /documents. */
export interface DocumentRecord {
  id: string;
  filename: string;
  doc_type: string;
  language: string;
  chunk_count: number;
  summary: string;
  uploaded_by: string;
  uploaded_at: string;
}

/** Single audit log event from GET /audit. */
export interface AuditEntry {
  id: number;
  admin_email: string;
  action: string;
  target: string;
  ip: string;
  created_at: string;
}

/** Paginated response wrapper for GET /audit. */
export interface AuditResponse {
  entries: AuditEntry[];
  total: number;
  offset: number;
  limit: number;
}

export interface QueryRow {
  query_hash: string;
  query_text: string;
  language: string;
  response_ms: number;
  sources_cnt: number;
  feedback: number;
  is_blocked: number;
  created_at: string;
}

/** A prompt A/B variant from GET /prompts. */
export interface PromptVariant {
  id: number;
  name: string;
  language: string;
  prompt_text: string;
  is_active: boolean;
  usage_count: number;
  avg_score: number;
}

/**
 * In-memory access token store (never written to localStorage for security).
 * Use {@link getToken} / {@link setToken} / {@link clearToken} to manage.
 */
let _memoryToken: string | null = null;

/** Returns the current JWT access token, or null if not authenticated. */
export const getToken = (): string | null => _memoryToken;
/** Stores a new JWT access token in memory. */
export const setToken = (t: string): void => { _memoryToken = t; };
/** Clears the stored JWT access token (triggers redirect to login). */
export const clearToken = (): void => { _memoryToken = null; };


async function api<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((opts.headers as Record<string, string>) ?? {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let res = await fetch(`${API_BASE}${path}`, { ...opts, headers });

  if (res.status === 401 && token) {
    const newAuth = await refreshAccessToken();
    if (newAuth) {
      headers["Authorization"] = `Bearer ${newAuth}`;
      res = await fetch(`${API_BASE}${path}`, { ...opts, headers });
    } else {
      clearToken();
      window.location.reload(); 
      throw new Error("unauthorized");
    }
  } else if (res.status === 401) {
    clearToken();
    throw new Error("unauthorized");
  }

  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<T>;
}


export const getLoginUrl = async () => (await api<{ url: string }>(`${ADMIN_BASE}/auth/login`)).url;

export const refreshAccessToken = async (): Promise<string | null> => {
  try {
    const res = await fetch(`${API_BASE}${ADMIN_BASE}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) return null;
    const data = await res.json() as { token: string };
    setToken(data.token);
    return data.token;
  } catch (err) {
    return null;
  }
};

export const fetchSummary = (days = 30) => api<AnalyticsSummary>(`${ADMIN_BASE}/analytics/summary?days=${days}`);
export const fetchDaily = (days = 30) => api<DailyStat[]>(`${ADMIN_BASE}/analytics/daily?days=${days}`);
export const fetchTopQueries = (days = 30, limit = 10) => api<TopQuery[]>(`${ADMIN_BASE}/analytics/top-queries?days=${days}&limit=${limit}`);
export const fetchFeedback = (days = 30) => api<FeedbackStat>(`${ADMIN_BASE}/analytics/feedback?days=${days}`);

export const fetchDocuments = () => api<DocumentRecord[]>(`${ADMIN_BASE}/documents`);
export const deleteDocument = (id: string) => api<unknown>(`${ADMIN_BASE}/documents/${id}`, { method: "DELETE" });

const UPLOAD_POLL_TIMEOUT_MS = 5 * 60 * 1000; 

export const uploadDocument = async (file: File) => {
  const token = getToken();
  const fd = new FormData();
  fd.append("file", file);
  const h: Record<string, string> = {};
  if (token) h["Authorization"] = `Bearer ${token}`;
  
  const uploadRes = await fetch(`${API_BASE}${ADMIN_BASE}/documents/upload`, { method: "POST", headers: h, body: fd });
  if (!uploadRes.ok) throw new Error(await uploadRes.text());
  
  const { job_id } = await uploadRes.json() as { job_id: string };

  return new Promise<void>((resolve, reject) => {
    const startedAt = Date.now();

    const check = async () => {
      if (Date.now() - startedAt > UPLOAD_POLL_TIMEOUT_MS) {
        reject(new Error(
          "Час очікування закінчився (5 хв). Перевірте документи — файл міг завантажитися успішно."
        ));
        return;
      }

      try {
        const jobRes = await fetch(`${API_BASE}${ADMIN_BASE}/documents/jobs/${job_id}`, { headers: h });
        if (!jobRes.ok) throw new Error("Failed to check status");
        
        const job = await jobRes.json() as { status: string; error: string; progress: number };
        
        if (job.status === "completed") {
          resolve();
        } else if (job.status === "failed") {
          reject(new Error(job.error || "Upload failed during processing"));
        } else {
          setTimeout(check, 1500); 
        }
      } catch (err) {
        reject(err);
      }
    };
    setTimeout(check, 1000);
  });
};

export const fetchAudit = (offset = 0, limit = 5) => api<AuditResponse>(`${ADMIN_BASE}/audit?offset=${offset}&limit=${limit}`);

export const fetchQueries = (days = 30, limit = 50) => api<QueryRow[]>(`${ADMIN_BASE}/queries?days=${days}&limit=${limit}`);

export const renameDocument = (id: string, newName: string) => api<unknown>(`${ADMIN_BASE}/documents/${id}/rename`, {
  method: "PATCH",
  body: JSON.stringify({ filename: newName }),
});

export const getDocumentDownloadUrl = (id: string) => `${API_BASE}${ADMIN_BASE}/documents/${id}/download`;

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


export const logout = async (): Promise<void> => {
  try {
    await api<unknown>(`${ADMIN_BASE}/auth/logout`, { method: "POST" });
  } finally {
    clearToken();
  }
};


export interface AdminUser {
  id: number;
  email: string;
  added_by: string;
  added_at: string;
}

export const fetchAdmins = () => api<AdminUser[]>(`${ADMIN_BASE}/admins`);

export const addAdmin = (email: string) => api<AdminUser>(`${ADMIN_BASE}/admins`, {
  method: "POST",
  body: JSON.stringify({ email }),
});

export const removeAdmin = (email: string) => api<unknown>(`${ADMIN_BASE}/admins/${encodeURIComponent(email)}`, {
  method: "DELETE",
});

export interface ReindexAllResult {
  status: string;
  count: number;
}

export const reindexDocument = (documentId: string) =>
  api<{ status: string; document_id: string }>(`${ADMIN_BASE}/documents/${documentId}/reindex`, {
    method: "POST",
  });

export const reindexAll = () =>
  api<ReindexAllResult>(`${ADMIN_BASE}/documents/reindex-all`, {
    method: "POST",
  });
export const pollJobStatus = async (jobId: string, authHeaders: Record<string, string>) => {
  const res = await fetch(`${API_BASE}${ADMIN_BASE}/documents/jobs/${jobId}`, { headers: authHeaders });
  if (!res.ok) throw new Error("Failed to check status");
  return res.json() as Promise<{ status: string; error: string; progress: number; current_step: string }>;
};

