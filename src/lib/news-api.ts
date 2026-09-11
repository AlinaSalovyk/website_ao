/**
 * News API types and client.
 *
 * Used by both Astro SSR pages (server-side fetch) and React components
 * (client-side pagination / filtering). The same PUBLIC_API_URL env var
 * is used throughout.
 */

// ─── Security Helpers ──────────────────────────────────────────────────────────

/**
 * Safely escapes HTML special characters to prevent XSS vulnerability in LightGallery subHtml
 */
export function escapeHtml(str: string): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NewsLocale {
  locale: string;
  title: string;
  slug: string;
  description: string;
  /** Full HTML article body (sanitized server-side). */
  content: string;
  seo_title: string;
  seo_description: string;
}

export interface NewsTag {
  id: string;
  slug: string;
  name: string;
}

export interface NewsCategoryLocale {
  locale: string;
  name: string;
  slug: string;
  description: string;
  seo_title: string;
  seo_description: string;
}

export interface NewsCategory {
  id: string;
  color: string;
  icon: string;
  cover_image: string;
  locales: Record<string, NewsCategoryLocale>;
}

export interface NewsAuthor {
  name: string;
  avatar?: string;
  position?: string;
}

export interface NewsAttachment {
  id: string;
  news_id: string;
  original_name: string;
  stored_name: string;
  mime_type: string;
  extension: string;
  size_bytes: number;
  sort_order: number;
  title_uk: string;
  title_en: string;
  url?: string;
  created_at: string;
}

export interface NewsGalleryImage {
  id: string;
  news_id: string;
  original_name: string;
  stored_name: string;
  mime_type: string;
  extension: string;
  size_bytes: number;
  width: number;
  height: number;
  sort_order: number;
  alt_uk: string;
  alt_en: string;
  caption_uk: string;
  caption_en: string;
  url?: string;
  thumbnail_url?: string;
  large_url?: string;
  created_at: string;
}

export interface NewsArticle {
  id: string;
  status: "draft" | "published";
  category_id: string;
  category?: NewsCategory;
  tags: NewsTag[];
  author: NewsAuthor;
  image_url: string;
  cover_position?: string;
  gallery?: string[];
  gallery_images?: NewsGalleryImage[];
  video_url?: string;
  video_type?: "external" | "uploaded";
  attachments?: NewsAttachment[];
  is_pinned: boolean;
  publish_at?: string;
  published_at?: string;
  created_at: string;
  updated_at: string;
  locales: Record<string, NewsLocale>;
  /** Set by server when preview token is used. */
  preview_token?: string;
}

export interface NewsListResponse {
  articles: NewsArticle[];
  total: number;
  offset: number;
  limit: number;
  page: number;
}

export interface NewsListParams {
  locale?: string;
  status?: "draft" | "published" | "";
  category?: string;
  tag?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// ─── Client ───────────────────────────────────────────────────────────────────

import { getSsrApiBase } from "./api-config";

const getBase = (): string => {
  let url = "";
  if (typeof process !== "undefined" && process.env?.PUBLIC_API_URL) {
    url = process.env.PUBLIC_API_URL.trim();
  } else if (typeof import.meta !== "undefined" && import.meta.env?.PUBLIC_API_URL) {
    url = (import.meta.env.PUBLIC_API_URL as string).trim();
  }
  if (typeof window !== "undefined" && window.location.protocol === "https:" && url.startsWith("http://")) {
    return "";
  }
  return url || (typeof window !== "undefined" ? "" : getSsrApiBase());
};

/**
 * Fetch a paginated list of published news articles.
 */
export async function fetchNewsList(
  params: NewsListParams = {}
): Promise<NewsListResponse> {
  const {
    locale = "uk",
    status = "published",
    category = "",
    tag = "",
    search = "",
    page = 1,
    limit = 12,
  } = params;

  const qs = new URLSearchParams();
  qs.set("locale", locale);
  if (status) qs.set("status", status);
  if (category) qs.set("category", category);
  if (tag) qs.set("tag", tag);
  if (search) qs.set("search", search);
  qs.set("page", String(page));
  qs.set("limit", String(limit));

  const res = await fetch(`${getBase()}/api/v1/news?${qs}`, {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`fetchNewsList: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<NewsListResponse>;
}

/**
 * Fetch a single published article by its locale-specific slug.
 * Returns null if the article is not found (404).
 */
export async function fetchNewsBySlug(
  slug: string,
  locale = "uk"
): Promise<NewsArticle | null> {
  const res = await fetch(
    `${getBase()}/api/v1/news/${encodeURIComponent(slug)}?locale=${locale}`,
    { headers: { Accept: "application/json" }, redirect: "follow" }
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`fetchNewsBySlug: ${res.status}`);
  return res.json() as Promise<NewsArticle>;
}

/**
 * Fetch all news categories.
 */
export async function fetchNewsCategories(): Promise<NewsCategory[]> {
  const res = await fetch(`${getBase()}/api/v1/news/categories`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return [];
  return res.json() as Promise<NewsCategory[]>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Format a UTC ISO date string into a localised short date.
 * Matches the existing formatArticleDate behaviour.
 */
export function formatNewsDate(
  isoString: string | undefined,
  locale: "uk" | "en" = "uk"
): string {
  if (!isoString) return "";
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime()) || d.getFullYear() <= 1) {
      return "";
    }
    return d.toLocaleDateString(locale === "uk" ? "uk-UA" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return isoString;
  }
}

/**
 * Safely extract the locale-aware title from an article, with UK fallback.
 */
export function articleTitle(
  article: NewsArticle,
  locale: "uk" | "en"
): string {
  return (
    article.locales?.[locale]?.title ??
    article.locales?.["uk"]?.title ??
    ""
  );
}

/**
 * Safely extract the locale-aware description/summary from an article.
 */
export function articleDescription(
  article: NewsArticle,
  locale: "uk" | "en"
): string {
  return (
    article.locales?.[locale]?.description ??
    article.locales?.["uk"]?.description ??
    ""
  );
}

/**
 * Safely extract the locale-aware slug from an article.
 */
export function articleSlug(article: NewsArticle, locale: "uk" | "en"): string {
  return (
    article.locales?.[locale]?.slug ??
    article.locales?.["uk"]?.slug ??
    article.id
  );
}

/**
 * Get the category display name for the current locale.
 */
export function categoryName(
  cat: NewsCategory | undefined,
  locale: "uk" | "en"
): string {
  if (!cat) return "";
  return cat.locales?.[locale]?.name ?? cat.locales?.["uk"]?.name ?? "Без категорії";
}

/**
 * Get the category color (Tailwind keyword) with a fallback.
 */
export function categoryColor(cat: NewsCategory | undefined): string {
  return cat?.color || "slate";
}

/**
 * Get the category slug for the given locale.
 */
export function categorySlug(cat: NewsCategory | undefined, locale: "uk" | "en"): string {
  if (!cat) return "";
  return cat.locales?.[locale]?.slug ?? cat.locales?.["uk"]?.slug ?? "";
}

/**
 * Get full image URL by prepending backend API base if relative.
 */
export function getFullImageUrl(url: string | undefined): string {
  if (!url) return "";
  if (url.startsWith("blob:") || url.startsWith("http")) return url;
  let formatted = url;
  if (!formatted.startsWith("/")) {
    if (formatted.startsWith("news/")) {
      formatted = `/${formatted}`;
    } else if (formatted.startsWith("cat-") || formatted.startsWith("category-")) {
      formatted = `/news-images/category-images/${formatted}`;
    } else if (formatted.startsWith("art-") || formatted.startsWith("news-")) {
      formatted = `/news-images/news-images/${formatted}`;
    } else if (/\.(jpg|jpeg|png|webp|gif|svg)$/i.test(formatted)) {
      formatted = `/news-images/news-images/${formatted}`;
    } else {
      formatted = `/${formatted}`;
    }
  }
  return `${getBase()}${formatted}`;
}

/**
 * Resolves all relative image src URLs inside an HTML content string to full backend API URLs.
 */
export function resolveHtmlMediaUrls(html: string): string {
  if (!html) return "";
  return html.replace(/(<img\s+[^>]*?src=["'])([^"']+)(["'])/gi, (_match, prefix, src, suffix) => {
    return `${prefix}${getFullImageUrl(src)}${suffix}`;
  });
}

/**
 * Safely resolves category cover image URL.
 */
export function getCategoryCoverUrl(url: string | undefined): string {
  return getFullImageUrl(url);
}

/**
 * Build an image src string for cover image.
 */
export function buildImageSrcSet(imageUrl: string): string {
  return getFullImageUrl(imageUrl);
}

/**
 * Format bytes into readable human format (KB, MB).
 */
export function formatFileSize(bytes: number): string {
  if (!bytes || bytes <= 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Safely extract display title for an attachment based on locale with fallback.
 */
export function attachmentDisplayName(
  att: NewsAttachment,
  locale: "uk" | "en" = "uk"
): string {
  if (locale === "en") {
    return att.title_en?.trim() || att.title_uk?.trim() || att.original_name;
  }
  return att.title_uk?.trim() || att.original_name;
}

/**
 * Builds canonical news attachment file URL for viewing (inline) or downloading.
 * Requires both newsId and attachmentId.
 */
export function getNewsAttachmentFileUrl(
  newsId: string,
  attachmentId: string,
  options?: { download?: boolean }
): string {
  if (!newsId || !attachmentId) {
    throw new Error("newsId and attachmentId are required to build attachment URL");
  }
  const baseUrl = `/api/v1/news/${encodeURIComponent(newsId)}/attachments/${encodeURIComponent(attachmentId)}/file`;
  if (options?.download) {
    return `${baseUrl}?download=1`;
  }
  return baseUrl;
}

/**
 * Builds canonical news attachment download URL.
 */
export function getNewsAttachmentDownloadUrl(
  newsId: string,
  attachmentId: string
): string {
  return getNewsAttachmentFileUrl(newsId, attachmentId, { download: true });
}

/**
 * Determines whether an attachment can be previewed inline in the browser.
 * Returns true ONLY for formats with native in-browser preview support (PDF, TXT).
 * All office documents (DOC, DOCX, XLS, XLSX, PPT, PPTX, ODT, ODS, ODP, RTF, CSV) return false.
 */
export function canPreviewAttachment(extOrMime: string | undefined): boolean {
  if (!extOrMime) return false;
  const val = extOrMime.trim().toLowerCase().replace(/^\./, "");
  if (val === "pdf" || val === "application/pdf") return true;
  if (val === "txt" || val === "text/plain") return true;
  return false;
}

/**
 * Transliterates Cyrillic text (e.g. Ukrainian author names) into Latin format
 * following standard Ukrainian-to-English transliteration conventions.
 */
export function transliterateCyrillic(text: string): string {
  if (!text) return "";
  const map: Record<string, string> = {
    'А': 'A', 'а': 'a',
    'Б': 'B', 'б': 'b',
    'В': 'V', 'в': 'v',
    'Г': 'H', 'г': 'h',
    'Ґ': 'G', 'ґ': 'g',
    'Д': 'D', 'д': 'd',
    'Е': 'E', 'е': 'e',
    'Є': 'Ye', 'є': 'ie',
    'Ж': 'Zh', 'ж': 'zh',
    'З': 'Z', 'з': 'z',
    'И': 'Y', 'и': 'y',
    'І': 'I', 'і': 'i',
    'Ї': 'Yi', 'ї': 'i',
    'Й': 'Y', 'й': 'i',
    'К': 'K', 'к': 'k',
    'Л': 'L', 'л': 'l',
    'М': 'M', 'м': 'm',
    'Н': 'N', 'н': 'n',
    'О': 'O', 'о': 'o',
    'П': 'P', 'п': 'p',
    'Р': 'R', 'р': 'r',
    'С': 'S', 'с': 's',
    'Т': 'T', 'т': 't',
    'У': 'U', 'у': 'u',
    'Ф': 'F', 'ф': 'f',
    'Х': 'Kh', 'х': 'kh',
    'Ц': 'Ts', 'ц': 'ts',
    'Ч': 'Ch', 'ч': 'ch',
    'Ш': 'Sh', 'ш': 'sh',
    'Щ': 'Shch', 'щ': 'shch',
    'Ю': 'Yu', 'ю': 'iu',
    'Я': 'Ya', 'я': 'ia',
    'Ь': '', 'ь': '',
    "'": '', '’': '', '‘': ''
  };

  const words = text.split(" ");
  return words
    .map((word) => {
      if (!word) return "";
      let res = "";
      for (let i = 0; i < word.length; i++) {
        const char = word[i];
        if (i === 0) {
          if (char === 'є') { res += 'Ye'; continue; }
          if (char === 'ї') { res += 'Yi'; continue; }
          if (char === 'ю') { res += 'Yu'; continue; }
          if (char === 'я') { res += 'Ya'; continue; }
        }
        res += map[char] !== undefined ? map[char] : char;
      }
      return res;
    })
    .join(" ");
}

/**
 * Format author display name according to the target locale.
 * Automatically transliterates Cyrillic names to Latin for English locale.
 */
export function formatAuthorName(
  name: string | undefined,
  locale: "uk" | "en" = "uk"
): string {
  if (!name) return "";
  if (locale === "uk") return name;
  return transliterateCyrillic(name);
}

const POSITION_TRANSLATIONS: Record<string, string> = {
  "вчитель": "Teacher",
  "викладач": "Lecturer",
  "старший викладач": "Senior Lecturer",
  "доцент": "Associate Professor",
  "професор": "Professor",
  "асистент": "Assistant",
  "декан": "Dean",
  "заступник декана": "Deputy Dean",
  "ректор": "Rector",
  "проректор": "Vice-Rector",
  "завідувач кафедри": "Head of Department",
  "зав. кафедри": "Head of Department",
  "редактор": "Editor",
  "головний редактор": "Editor-in-Chief",
  "прес-служба": "Press Service",
  "адміністрація": "Administration",
  "журналіст": "Journalist",
  "автор": "Author",
  "студент": "Student",
  "аспірант": "PhD Student",
  "дослідник": "Researcher",
  "науковий співробітник": "Research Fellow",
};

/**
 * Format author position/role according to target locale.
 * Uses dictionary translations for common academic roles with transliteration fallback for EN.
 */
export function formatAuthorPosition(
  position: string | undefined,
  locale: "uk" | "en" = "uk"
): string {
  if (!position) return "";
  if (locale === "uk") return position;
  const lower = position.trim().toLowerCase();
  if (POSITION_TRANSLATIONS[lower]) {
    return POSITION_TRANSLATIONS[lower];
  }
  return transliterateCyrillic(position);
}

/**
 * Fetch photo gallery images for a news article.
 */
export async function fetchNewsGallery(newsId: string): Promise<NewsGalleryImage[]> {
  if (!newsId) return [];
  const res = await fetch(`${getBase()}/api/v1/news/${encodeURIComponent(newsId)}/gallery`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return [];
  return res.json() as Promise<NewsGalleryImage[]>;
}

/**
 * Upload a photo to the article's gallery.
 */
export async function uploadNewsGalleryImage(
  newsId: string,
  file: File,
  metadata?: { alt_uk?: string; alt_en?: string; caption_uk?: string; caption_en?: string }
): Promise<NewsGalleryImage> {
  const formData = new FormData();
  formData.append("file", file);
  if (metadata?.alt_uk) formData.append("alt_uk", metadata.alt_uk);
  if (metadata?.alt_en) formData.append("alt_en", metadata.alt_en);
  if (metadata?.caption_uk) formData.append("caption_uk", metadata.caption_uk);
  if (metadata?.caption_en) formData.append("caption_en", metadata.caption_en);

  const res = await fetch(`${getBase()}/api/v1/news/${encodeURIComponent(newsId)}/gallery`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || `Upload gallery image failed: ${res.status}`);
  }
  return res.json() as Promise<NewsGalleryImage>;
}

/**
 * Update metadata (alt/caption/sort_order) of a gallery image.
 */
export async function updateNewsGalleryImage(
  newsId: string,
  imageId: string,
  data: { alt_uk?: string; alt_en?: string; caption_uk?: string; caption_en?: string; sort_order?: number }
): Promise<void> {
  const res = await fetch(
    `${getBase()}/api/v1/news/${encodeURIComponent(newsId)}/gallery/${encodeURIComponent(imageId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }
  );
  if (!res.ok) {
    throw new Error(`Update gallery image failed: ${res.status}`);
  }
}

/**
 * Delete a photo from an article's gallery.
 */
export async function deleteNewsGalleryImage(newsId: string, imageId: string): Promise<void> {
  const res = await fetch(
    `${getBase()}/api/v1/news/${encodeURIComponent(newsId)}/gallery/${encodeURIComponent(imageId)}`,
    { method: "DELETE" }
  );
  if (!res.ok) {
    throw new Error(`Delete gallery image failed: ${res.status}`);
  }
}

/**
 * Reorder gallery images of an article.
 */
export async function reorderNewsGalleryImages(newsId: string, imageIds: string[]): Promise<void> {
  const res = await fetch(
    `${getBase()}/api/v1/news/${encodeURIComponent(newsId)}/gallery/reorder`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(imageIds),
    }
  );
  if (!res.ok) {
    throw new Error(`Reorder gallery images failed: ${res.status}`);
  }
}


