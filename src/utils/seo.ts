export function normalizeText(value?: string | null): string {
  if (!value) return "";
  return value.trim();
}

export function computeAutoFillSEO(
  title: string,
  slug: string,
  seo_title: string,
  seo_description: string,
  description: string,
  content: string,
  slugifyFn: (s: string) => string
) {
  const next = { slug, seo_title, seo_description };
  let filled = false;

  if (normalizeText(next.slug) === "") {
    const s = slugifyFn(title);
    if (s) { next.slug = s; filled = true; }
  }
  if (normalizeText(next.seo_title) === "") {
    if (normalizeText(title)) { next.seo_title = title; filled = true; }
  }
  if (normalizeText(next.seo_description) === "") {
    const desc = normalizeText(description) || extractArticleSummary(content);
    if (desc) { next.seo_description = desc; filled = true; }
  }

  return { next, filled };
}

export function extractArticleSummary(html: string, maxLength: number = 160): string {
  if (!html || !html.trim()) return "";
  
  // Strip script and style content entirely
  let text = html.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, " ");
  
  // Strip all HTML tags
  text = text.replace(/<[^>]*>?/gm, " ");
  
  // Decode common HTML entities safely
  text = text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"');
    
  // Normalize whitespace
  text = text.replace(/\s+/g, " ").trim();
  
  if (text.length <= maxLength) return text;
  
  // Semantic truncation on sentence or word boundary
  let truncated = text.slice(0, maxLength);
  const lastPeriod = truncated.lastIndexOf(".");
  
  // If period is in the second half of the string, cut at the sentence boundary
  if (lastPeriod > maxLength / 2) {
    return truncated.slice(0, lastPeriod + 1);
  }
  
  const lastSpace = truncated.lastIndexOf(" ");
  if (lastSpace > 0) {
    truncated = truncated.slice(0, lastSpace);
  }
  
  if (truncated.length < text.length) {
    truncated += "...";
  }
  
  return truncated;
}

export function getEffectiveSeoPreview(params: {
  title?: string;
  description?: string;
  content?: string;
  seoTitle?: string;
  seoDescription?: string;
  fallbackTitle: string;
  fallbackDescription: string;
}) {
  const effectiveTitle = normalizeText(params.seoTitle) || normalizeText(params.title) || params.fallbackTitle;
  const contentFallback = normalizeText(params.description) || extractArticleSummary(params.content || "");
  const effectiveDescription = normalizeText(params.seoDescription) || contentFallback || params.fallbackDescription;

  return { effectiveTitle, effectiveDescription };
}
