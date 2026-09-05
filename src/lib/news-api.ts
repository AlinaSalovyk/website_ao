/**
 * News API types and client.
 *
 * Used by both Astro SSR pages (server-side fetch) and React components
 * (client-side pagination / filtering). The same PUBLIC_API_URL env var
 * is used throughout.
 */

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
  keywords: string;
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
  video_url?: string;
  video_type?: "external" | "uploaded";
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

const getBase = (): string =>
  typeof import.meta !== "undefined" && import.meta.env?.PUBLIC_API_URL
    ? (import.meta.env.PUBLIC_API_URL as string)
    : "http://localhost:8280";

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
    } else {
      formatted = `/${formatted}`;
    }
  }
  return `${getBase()}${formatted}`;
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
