/**
 * /news/rss.xml — RSS 2.0 feed for published Ukrainian news articles.
 *
 * SSR page: rendered on every request so the feed always reflects the latest
 * published articles without a rebuild.
 *
 * Fetches article list from the Go API and serialises as RSS 2.0.
 * Format follows https://www.rssboard.org/rss-specification.
 */
export const prerender = false;

import type { APIRoute } from "astro";

interface NewsLocale {
  title: string;
  slug: string;
  description: string;
  seo_description?: string;
}

interface NewsArticle {
  id: string;
  published_at?: string;
  created_at: string;
  locales?: Record<string, NewsLocale>;
  image_url?: string;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export const GET: APIRoute = async ({ site, url }) => {
  const API_BASE = import.meta.env.PUBLIC_API_URL ?? "http://localhost:8280";
  const siteUrl = site?.toString()?.replace(/\/$/, "") ?? url.origin;

  let articles: NewsArticle[] = [];

  try {
    const res = await fetch(
      `${API_BASE}/api/v1/news?locale=uk&status=published&limit=50`,
      { headers: { Accept: "application/json" } }
    );
    if (res.ok) {
      const data = (await res.json()) as { articles: NewsArticle[] };
      articles = data.articles ?? [];
    }
  } catch {
    // Non-fatal — return empty feed rather than error
  }

  const items = articles
    .map((article) => {
      const uk = article.locales?.["uk"];
      if (!uk?.title || !uk?.slug) return "";
      const link = `${siteUrl}/news/${escapeXml(uk.slug)}/`;
      const pubDate = new Date(
        article.published_at ?? article.created_at
      ).toUTCString();
      const desc = uk.seo_description || uk.description || "";
      return `
    <item>
      <title>${escapeXml(uk.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <description>${escapeXml(desc)}</description>
      <pubDate>${pubDate}</pubDate>
      ${article.image_url ? `<enclosure url="${escapeXml(article.image_url)}-640w.webp" type="image/webp" length="0" />` : ""}
    </item>`;
    })
    .join("\n");

  const lastBuildDate =
    articles.length > 0
      ? new Date(
        articles[0].published_at ?? articles[0].created_at
      ).toUTCString()
      : new Date().toUTCString();

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Новини та події — Інститут ІТ та бізнесу НаУОА</title>
    <link>${siteUrl}/news/</link>
    <description>Останні новини, події та досягнення Інституту інформаційних технологій та бізнесу НаУОА.</description>
    <language>uk</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${siteUrl}/news/rss.xml" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
};
