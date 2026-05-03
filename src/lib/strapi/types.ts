/**
 * @module strapi/types
 *
 * Domain interfaces and Strapi API response shapes.
 *
 * Principle: Interface Segregation (ISP) — small, focused interfaces
 * rather than one monolithic type.
 */

import type { Locale } from '@/i18n';

// ─── Domain model ──────────────────────────────────────────────────────────

/**
 * The canonical Article used throughout Astro pages and React components.
 * This is the public contract — it never changes regardless of CMS.
 */
export interface Article {
  slug: string;
  /** ISO date string: "2026-03-15" */
  date: string;
  /** CSS gradient or image URL used as card background */
  image: string;
  title: Record<Locale, string>;
  summary: Record<Locale, string>;
  content: Record<Locale, string[]>;
  /** Cloudinary or other CDN image URL, undefined when no image is set */
  coverImageUrl?: string;
}

// ─── Strapi v5 API response shapes ────────────────────────────────────────

/** A single leaf node in a Strapi v5 rich-text block tree */
export interface StrapiTextNode {
  type: 'text';
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
}

/** A block in a Strapi v5 blocks (rich-text) field */
export interface StrapiBlock {
  type: string;
  children?: Array<StrapiTextNode | StrapiBlock>;
}

/** Shape of the Cloudinary/local media object returned by Strapi */
export interface StrapiMedia {
  url: string;
  alternativeText?: string | null;
  width?: number;
  height?: number;
}

/**
 * Raw article document as returned by GET /api/articles.
 * Maps directly to the schema.json field names.
 */
export interface StrapiArticleRaw {
  id: number;
  documentId: string;
  slug: string;
  date: string;
  title_uk: string;
  title_en: string;
  summary_uk: string;
  summary_en: string;
  content_uk: StrapiBlock[] | null;
  content_en: StrapiBlock[] | null;
  cover_image: StrapiMedia | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
}

/** Strapi v5 collection response envelope */
export interface StrapiListResponse<T> {
  data: T[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

/** Strapi v5 single-item response envelope */
export interface StrapiSingleResponse<T> {
  data: T;
  meta: Record<string, unknown>;
}
