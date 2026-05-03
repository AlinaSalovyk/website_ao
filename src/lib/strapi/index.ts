/**
 * @module strapi/index
 *
 * Public API of the Strapi integration layer.
 *
 * This is the ONLY file that Astro pages and components should import from.
 * Internal modules (StrapiHttpClient, ArticleMapper, etc.) are not re-exported
 * — they are implementation details.
 *
 * Usage in Astro pages (build-time only):
 *
 *   import { articleRepository } from '@/lib/strapi';
 *   const articles = await articleRepository.findAll();
 *
 * The singleton is created once per build.
 * Environment variables are read at module initialisation time.
 */

import { StrapiHttpClient } from './StrapiHttpClient';
import { ArticleRepository } from './ArticleRepository';

// Re-export types that consumers need
export type { Article, StrapiArticleRaw, StrapiBlock } from './types';
export { formatArticleDate } from './ArticleMapper';

// ─── Singleton factory ─────────────────────────────────────────────────────

function createRepository(): ArticleRepository {
  const baseUrl =
    import.meta.env.STRAPI_URL ?? 'http://127.0.0.1:1337';

  // STRAPI_TOKEN is optional:
  //  - Empty locally (public API with permissions set in Strapi admin)
  //  - Set on Vercel for production (prevents unauthenticated writes)
  const token = import.meta.env.STRAPI_TOKEN ?? '';

  const client = new StrapiHttpClient(baseUrl, token || undefined);
  return new ArticleRepository(client);
}

/**
 * Pre-configured ArticleRepository singleton.
 * Reads STRAPI_URL and STRAPI_TOKEN from import.meta.env.
 */
export const articleRepository: ArticleRepository = createRepository();
