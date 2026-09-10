import { api, ADMIN_BASE, API_BASE, getToken } from "./client";
import type { 
  AdminNewsTag, AdminNewsCategory, AdminNewsArticle, AdminNewsListResponse, AdminNewsListParams 
} from "../types/api.types";

export const fetchAdminNewsList = (params: AdminNewsListParams = {}): Promise<AdminNewsListResponse> => {
  const qs = new URLSearchParams();
  if (params.status) qs.set("status", params.status);
  if (params.category) qs.set("category", params.category);
  if (params.tag) qs.set("tag", params.tag);
  if (params.search) qs.set("search", params.search);
  if (params.include_deleted) qs.set("include_deleted", "true");
  qs.set("page", String(params.page ?? 1));
  qs.set("limit", String(params.limit ?? 20));
  return api<AdminNewsListResponse>(`${ADMIN_BASE}/news?${qs}`);
};

export const fetchAdminNewsById = (id: string): Promise<AdminNewsArticle> =>
  api<AdminNewsArticle>(`${ADMIN_BASE}/news/${id}`);

export const createAdminNews = (article: Partial<AdminNewsArticle>): Promise<AdminNewsArticle> =>
  api<AdminNewsArticle>(`${ADMIN_BASE}/news`, {
    method: "POST",
    body: JSON.stringify(article),
  });

export const updateAdminNews = (id: string, article: Partial<AdminNewsArticle>): Promise<void> =>
  api<void>(`${ADMIN_BASE}/news/${id}`, {
    method: "PUT",
    body: JSON.stringify(article),
  });

export const setAdminNewsStatus = (id: string, status: "draft" | "published"): Promise<void> =>
  api<void>(`${ADMIN_BASE}/news/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });

export const deleteAdminNews = (id: string): Promise<void> =>
  api<void>(`${ADMIN_BASE}/news/${id}`, { method: "DELETE" });

export const restoreAdminNews = (id: string): Promise<void> =>
  api<void>(`${ADMIN_BASE}/news/${id}/restore`, { method: "POST" });

export const uploadAdminInlineImage = async (file: File): Promise<{ image_url: string }> => {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const form = new FormData();
  form.append("image", file);
  const res = await fetch(`${API_BASE}${ADMIN_BASE}/news/upload-image`, {
    method: "POST",
    headers,
    body: form,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<{ image_url: string }>;
};

export const uploadAdminVideo = async (file: File): Promise<{ video_url: string }> => {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const form = new FormData();
  form.append("video", file);
  const res = await fetch(`${API_BASE}${ADMIN_BASE}/news/upload-video`, {
    method: "POST",
    headers,
    body: form,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<{ video_url: string }>;
};

export const uploadAdminNewsImage = async (id: string, file: File): Promise<{ image_url: string }> => {
  if (!id || id === "temp-draft" || id.startsWith("new")) {
    return uploadAdminInlineImage(file);
  }
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const form = new FormData();
  form.append("image", file);
  const res = await fetch(`${API_BASE}${ADMIN_BASE}/news/${id}/image`, {
    method: "POST",
    headers,
    body: form,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<{ image_url: string }>;
};

export const checkAdminNewsSlug = (
  locale: string,
  slug: string,
  excludeId = ""
): Promise<{ available: boolean }> => {
  const qs = new URLSearchParams({ locale, slug });
  if (excludeId) qs.set("exclude", excludeId);
  return api<{ available: boolean }>(`${ADMIN_BASE}/news/slug-check?${qs}`);
};

export const fetchAdminNewsCategories = (): Promise<AdminNewsCategory[]> =>
  api<AdminNewsCategory[]>(`${ADMIN_BASE}/news/categories`);

export const createAdminNewsCategory = (category: Partial<AdminNewsCategory>): Promise<AdminNewsCategory> =>
  api<AdminNewsCategory>(`${ADMIN_BASE}/news/categories`, {
    method: "POST",
    body: JSON.stringify(category),
  });

export const updateAdminNewsCategory = (id: string, category: Partial<AdminNewsCategory>): Promise<AdminNewsCategory> =>
  api<AdminNewsCategory>(`${ADMIN_BASE}/news/categories/${id}`, {
    method: "PUT",
    body: JSON.stringify(category),
  });

export const deleteAdminNewsCategory = (id: string, transferTo?: string): Promise<void> => {
  let url = `${ADMIN_BASE}/news/categories/${id}`;
  if (transferTo) {
    url += `?transfer_to=${transferTo}`;
  }
  return api<void>(url, { method: "DELETE" });
};

export const restoreAdminNewsCategory = (id: string): Promise<void> =>
  api<void>(`${ADMIN_BASE}/news/categories/${id}/restore`, { method: "POST" });

export const reorderAdminNewsCategories = (ids: string[]): Promise<void> =>
  api<void>(`${ADMIN_BASE}/news/categories/reorder`, {
    method: "PATCH",
    body: JSON.stringify(ids),
  });

export const uploadAdminCategoryCover = async (id: string, file: File): Promise<{ cover_image: string }> => {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const form = new FormData();
  form.append("image", file);
  const res = await fetch(`${API_BASE}${ADMIN_BASE}/news/categories/${id}/image`, {
    method: "POST",
    headers,
    body: form,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<{ cover_image: string }>;
};

export const fetchAdminNewsTags = (): Promise<AdminNewsTag[]> =>
  api<AdminNewsTag[]>(`${ADMIN_BASE}/news/tags`);

export const saveDraft = (sessionId: string, data: any) => api<unknown>(`${ADMIN_BASE}/news/drafts/${sessionId}`, {
  method: "POST",
  body: JSON.stringify(data),
});

export const uploadAdminNewsAttachment = async (
  newsId: string,
  file: File,
  titleUk = "",
  titleEn = ""
): Promise<import("../types/api.types").AdminNewsAttachment> => {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const form = new FormData();
  form.append("file", file);
  if (titleUk) form.append("title_uk", titleUk);
  if (titleEn) form.append("title_en", titleEn);

  const res = await fetch(`${API_BASE}${ADMIN_BASE}/news/${newsId}/attachments`, {
    method: "POST",
    headers,
    body: form,
  });
  if (!res.ok) {
    const txt = await res.text();
    try {
      const parsed = JSON.parse(txt);
      throw new Error(parsed.message || parsed.error || "Upload failed");
    } catch (e: any) {
      if (e?.message && e.message !== "Upload failed") throw e;
      throw new Error(txt || "Upload failed");
    }
  }
  return res.json();
};

export const fetchAdminNewsAttachments = (newsId: string): Promise<import("../types/api.types").AdminNewsAttachment[]> =>
  api<import("../types/api.types").AdminNewsAttachment[]>(`${ADMIN_BASE}/news/${newsId}/attachments`);

export const updateAdminNewsAttachment = (
  newsId: string,
  attachmentId: string,
  payload: { title_uk?: string; title_en?: string; sort_order?: number }
): Promise<void> =>
  api<void>(`${ADMIN_BASE}/news/${newsId}/attachments/${attachmentId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

export const deleteAdminNewsAttachment = (
  newsId: string,
  attachmentId: string
): Promise<void> =>
  api<void>(`${ADMIN_BASE}/news/${newsId}/attachments/${attachmentId}`, {
    method: "DELETE",
  });

export const reorderAdminNewsAttachments = (
  newsId: string,
  ids: string[]
): Promise<void> =>
  api<void>(`${ADMIN_BASE}/news/${newsId}/attachments/reorder`, {
    method: "PATCH",
    body: JSON.stringify(ids),
  });

export const uploadAdminNewsGalleryImage = async (
  newsId: string,
  file: File,
  metadata?: { alt_uk?: string; alt_en?: string; caption_uk?: string; caption_en?: string }
): Promise<import("@/lib/news-api").NewsGalleryImage> => {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const form = new FormData();
  form.append("file", file);
  if (metadata?.alt_uk) form.append("alt_uk", metadata.alt_uk);
  if (metadata?.alt_en) form.append("alt_en", metadata.alt_en);
  if (metadata?.caption_uk) form.append("caption_uk", metadata.caption_uk);
  if (metadata?.caption_en) form.append("caption_en", metadata.caption_en);

  const res = await fetch(`${API_BASE}${ADMIN_BASE}/news/${newsId}/gallery`, {
    method: "POST",
    headers,
    body: form,
  });
  if (!res.ok) {
    const txt = await res.text();
    try {
      const parsed = JSON.parse(txt);
      throw new Error(parsed.message || parsed.error || "Upload gallery image failed");
    } catch (e: any) {
      if (e?.message && e.message !== "Upload gallery image failed") throw e;
      throw new Error(txt || "Upload gallery image failed");
    }
  }
  return res.json();
};

export const fetchAdminNewsGallery = (newsId: string): Promise<import("@/lib/news-api").NewsGalleryImage[]> =>
  api<import("@/lib/news-api").NewsGalleryImage[]>(`${ADMIN_BASE}/news/${newsId}/gallery`);

export const updateAdminNewsGalleryImage = (
  newsId: string,
  imageId: string,
  payload: { alt_uk?: string; alt_en?: string; caption_uk?: string; caption_en?: string; sort_order?: number }
): Promise<void> =>
  api<void>(`${ADMIN_BASE}/news/${newsId}/gallery/${imageId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

export const deleteAdminNewsGalleryImage = (
  newsId: string,
  imageId: string
): Promise<void> =>
  api<void>(`${ADMIN_BASE}/news/${newsId}/gallery/${imageId}`, {
    method: "DELETE",
  });

export const reorderAdminNewsGalleryImages = (
  newsId: string,
  ids: string[]
): Promise<void> =>
  api<void>(`${ADMIN_BASE}/news/${newsId}/gallery/reorder`, {
    method: "PATCH",
    body: JSON.stringify(ids),
  });


