/**
 * @module Admin/services/client
 * Core API client with token management and auto-refresh.
 */

export const API_BASE = import.meta.env.PUBLIC_API_URL ?? "";
export const ADMIN_PATH = import.meta.env.PUBLIC_ADMIN_PATH ?? "panel";
export const ADMIN_BASE = `/admin-${ADMIN_PATH}`;

let _memoryToken: string | null = null;

export const getToken = (): string | null => _memoryToken;
export const setToken = (t: string): void => {
  _memoryToken = t;
};
export const clearToken = (): void => {
  _memoryToken = null;
};

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

export async function api<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((opts.headers as Record<string, string>) ?? {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let res = await fetch(`${API_BASE}${path}`, { 
    ...opts, 
    headers,
    credentials: "include"
  });

  if (res.status === 401 && token) {
    const newAuth = await refreshAccessToken();
    if (newAuth) {
      headers["Authorization"] = `Bearer ${newAuth}`;
      res = await fetch(`${API_BASE}${path}`, { 
        ...opts, 
        headers,
        credentials: "include"
      });
    } else {
      clearToken();
      window.location.reload(); 
      throw new Error("unauthorized");
    }
  } else if (res.status === 401) {
    clearToken();
    throw new Error("unauthorized");
  }

  if (!res.ok) {
    const rawText = await res.text();
    const errorText = rawText.trim();
    if (errorText) {
      try {
        const parsed = JSON.parse(errorText);
        if (parsed && typeof parsed.message === "string" && parsed.message) {
          throw new Error(parsed.message);
        }
      } catch (e) {
        if (e instanceof Error && e.message !== errorText && !e.message.includes("JSON")) {
          throw e;
        }
      }
      throw new Error(errorText);
    }
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }
  if (res.status === 204) return {} as T;
  const text = await res.text();
  return text.trim() ? (JSON.parse(text) as T) : ({} as T);
}
