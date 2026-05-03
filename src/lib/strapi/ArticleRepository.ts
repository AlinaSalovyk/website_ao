/**
 * @module strapi/ArticleRepository
 *
 * Repository Pattern — all article-related data access in one place.
 *
 * Principles applied:
 *  - SRP: only responsible for article queries (not HTTP, not mapping)
 *  - DIP: depends on StrapiHttpClient abstraction, not fetch()
 *  - OCP: add new query methods without modifying existing ones
 *
 * Astro pages import and use this class at BUILD TIME only.
 * It is never instantiated in the browser.
 */

import type { StrapiArticleRaw } from './types';
import type { Article } from './types';
import { StrapiHttpClient } from './StrapiHttpClient';
import { mapStrapiArticle } from './ArticleMapper';

export class ArticleRepository {
  private readonly client: StrapiHttpClient;

  constructor(client: StrapiHttpClient) {
    this.client = client;
  }

  // ─── Query builders ────────────────────────────────────────────────────────

  /**
   * Common params shared by all article queries.
   * populate=* fetches the cover_image relation.
   */
  private baseParams(extra: Record<string, string> = {}): URLSearchParams {
    return new URLSearchParams({
      populate: '*',
      ...extra,
    });
  }

  // ─── Public query methods ──────────────────────────────────────────────────

  /**
   * Returns all published articles sorted by date descending.
   * Capped at 100 — sufficient for any news section.
   */
  async findAll(): Promise<Article[]> {
    const params = this.baseParams({
      'sort[0]': 'date:desc',
      'pagination[limit]': '100',
    });

    const raw = await this.client.getMany<StrapiArticleRaw>('articles', params);
    return raw.map(mapStrapiArticle);
  }

  /**
   * Returns the N most recently published articles.
   * Used by the home page news section.
   */
  async findLatest(count: number): Promise<Article[]> {
    const params = this.baseParams({
      'sort[0]': 'date:desc',
      'pagination[limit]': String(count),
    });

    const raw = await this.client.getMany<StrapiArticleRaw>('articles', params);
    return raw.map(mapStrapiArticle);
  }

  /**
   * Returns a single article by its slug, or undefined if not found.
   * Used by the dynamic [slug].astro page.
   */
  async findBySlug(slug: string): Promise<Article | undefined> {
    const params = this.baseParams({
      'filters[slug][$eq]': slug,
    });

    const raw = await this.client.getOne<StrapiArticleRaw>('articles', params);
    return raw ? mapStrapiArticle(raw) : undefined;
  }

  /**
   * Returns articles related to the given slug (latest N, excluding current).
   * Used by the ArticlePage sidebar.
   */
  async findRelated(currentSlug: string, count: number): Promise<Article[]> {
    const all = await this.findLatest(count + 1);
    return all.filter((a) => a.slug !== currentSlug).slice(0, count);
  }
}
