/**
 * @module strapi/ArticleMapper
 *
 * Pure mapping functions: Strapi API shape → domain Article.
 *
 * Principle: SRP — this module only knows how to transform data.
 * It contains zero side-effects (no fetch, no logging).
 *
 * Placing mapping logic here means:
 *  - Easy to unit-test (pure functions)
 *  - One place to update when the Strapi schema changes
 */

import type { Locale } from '@/i18n';
import type { Article, StrapiArticleRaw, StrapiBlock } from './types';

// ─── Rich-text extraction ──────────────────────────────────────────────────

/**
 * Recursively collects all text nodes from a Strapi v5 rich-text block tree.
 * Handles nested inline elements (bold, italic, links, etc.).
 */
function collectText(
  nodes: Array<StrapiBlock | { type: string; text?: string }> | undefined,
): string {
  if (!nodes) return '';
  return nodes
    .map((node) => {
      if ('text' in node && typeof node.text === 'string') return node.text;
      if ('children' in node && Array.isArray(node.children)) {
        return collectText(node.children as StrapiBlock[]);
      }
      return '';
    })
    .join('');
}

/**
 * Extracts non-empty paragraph strings from Strapi v5 rich-text blocks.
 * Only top-level paragraphs are returned — headings, lists, etc. are skipped.
 */
export function extractParagraphs(
  blocks: StrapiBlock[] | null | undefined,
): string[] {
  if (!blocks) return [];
  return blocks
    .filter((b) => b.type === 'paragraph')
    .map((b) => collectText(b.children))
    .filter((text) => text.trim().length > 0);
}

// ─── Article mapper ────────────────────────────────────────────────────────

/** Fallback background used when no cover image is uploaded */
const DEFAULT_GRADIENT =
  'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #1e40af 100%)';

/**
 * Robustly handles both absolute (Cloudinary) and relative (local fallback) URLs.
 */
function resolveImageUrl(url?: string): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http')) return url;
  
  // Fallback: prepend the Strapi backend URL if Cloudinary failed and it saved locally
  const backendUrl = import.meta.env.STRAPI_URL || 'https://strapi-production-c58f.up.railway.app';
  return `${backendUrl.replace(/\/$/, '')}${url}`;
}

/**
 * Maps a raw Strapi API document to the canonical Article domain object.
 *
 * Guarantees:
 *  - All fields are present (empty string / empty array as defaults)
 *  - Never throws — invalid input returns a safe empty object
 */
export function mapStrapiArticle(raw: StrapiArticleRaw): Article {
  const imageUrl = resolveImageUrl(raw.cover_image?.url);

  return {
    slug: raw.slug ?? '',
    date: raw.date ?? '',
    coverImageUrl: imageUrl,
    // Use the resolved URL as card background if available, else gradient
    image: imageUrl ?? DEFAULT_GRADIENT,
    title: {
      uk: raw.title_uk ?? '',
      en: raw.title_en ?? '',
    },
    summary: {
      uk: raw.summary_uk ?? '',
      en: raw.summary_en ?? '',
    },
    content: {
      uk: extractParagraphs(raw.content_uk),
      en: extractParagraphs(raw.content_en),
    },
  };
}

// ─── Date formatter ────────────────────────────────────────────────────────

/**
 * Formats an ISO date string for display in the given locale.
 * Consistent with the legacy formatArticleDate helper in src/data/articles.ts.
 */
export function formatArticleDate(dateStr: string, locale: Locale): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return dateStr; // guard against bad data
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.toLocaleDateString(locale === 'uk' ? 'uk-UA' : 'en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}
