/**
 * /news/sitemap.xml — News-specific sitemap in Sitemap Protocol format.
 *
 * SSR page: generated on each request, always reflects the current set of
 * published articles without a rebuild.
 *
 * Distinct from the main /sitemap.xml (static, generated at build time).
 * This sitemap covers only news URLs across both locales.
 */
export const prerender = false;

import type { APIRoute } from "astro";

interface NewsSlugEntry {
  article_id: string;
  locale: string;
  slug: string;
  title: string;
  updated_at: string;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export const GET: APIRoute = async ({ site, url }) => {
  const API_BASE = import.meta.env.PUBLIC_API_URL ?? "http://localhost:8080";
  const siteUrl = site?.toString()?.replace(/\/$/, "") ?? url.origin;

  let entries: NewsSlugEntry[] = [];

  try {
    const res = await fetch(`${API_BASE}/api/v1/news/sitemap`, {
      headers: { Accept: "application/json" },
    });
    if (res.ok) {
      entries = ((await res.json()) as NewsSlugEntry[]) ?? [];
    }
  } catch {
    // Non-fatal — return empty sitemap
  }

  let categories: any[] = [];
  try {
    const catRes = await fetch(`${API_BASE}/api/v1/news/categories`, {
      headers: { Accept: "application/json" },
    });
    if (catRes.ok) {
      categories = (await catRes.json()) ?? [];
    }
  } catch {
    // Non-fatal
  }

  // Group by article_id so we can emit hreflang pairs
  const byArticle = new Map<string, NewsSlugEntry[]>();
  for (const entry of entries) {
    if (!byArticle.has(entry.article_id)) {
      byArticle.set(entry.article_id, []);
    }
    byArticle.get(entry.article_id)!.push(entry);
  }

  const urls = Array.from(byArticle.values())
    .flatMap((group) =>
      group.map((entry) => {
        const localePath = entry.locale === "en" ? "/en/news/" : "/news/";
        const loc = `${siteUrl}${localePath}${escapeXml(entry.slug)}/`;
        const lastmod = entry.updated_at
          ? new Date(entry.updated_at).toISOString().split("T")[0]
          : "";

        // Build xhtml:link alternates for hreflang
        const alternates = group
          .map((alt) => {
            const altPath = alt.locale === "en" ? "/en/news/" : "/news/";
            return `    <xhtml:link rel="alternate" hreflang="${escapeXml(alt.locale)}" href="${siteUrl}${altPath}${escapeXml(alt.slug)}/"/>`;
          })
          .join("\n");

        return `
  <url>
    <loc>${loc}</loc>
    ${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
    ${alternates}
  </url>`;
      })
    )
    .join("\n");

  const catUrls = categories.map((cat) => {
    const ukSlug = cat.locales?.["uk"]?.slug || cat.slug;
    const enSlug = cat.locales?.["en"]?.slug;

    let res = "";
    
    // UK URL
    if (ukSlug) {
      const loc = `${siteUrl}/news/category/${escapeXml(ukSlug)}/`;
      const lastmod = cat.updated_at ? new Date(cat.updated_at).toISOString().split("T")[0] : "";
      
      const alternates = [];
      alternates.push(`    <xhtml:link rel="alternate" hreflang="uk" href="${loc}"/>`);
      if (enSlug) {
        alternates.push(`    <xhtml:link rel="alternate" hreflang="en" href="${siteUrl}/en/news/category/${escapeXml(enSlug)}/"/>`);
      }
      
      res += `
  <url>
    <loc>${loc}</loc>
    ${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
${alternates.join("\n")}
  </url>`;
    }

    // EN URL
    if (enSlug) {
      const loc = `${siteUrl}/en/news/category/${escapeXml(enSlug)}/`;
      const lastmod = cat.updated_at ? new Date(cat.updated_at).toISOString().split("T")[0] : "";
      
      const alternates = [];
      if (ukSlug) {
        alternates.push(`    <xhtml:link rel="alternate" hreflang="uk" href="${siteUrl}/news/category/${escapeXml(ukSlug)}/"/>`);
      }
      alternates.push(`    <xhtml:link rel="alternate" hreflang="en" href="${loc}"/>`);
      
      res += `
  <url>
    <loc>${loc}</loc>
    ${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
${alternates.join("\n")}
  </url>`;
    }

    return res;
  }).join("\n");

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml"
>
${catUrls}
${urls}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
};
