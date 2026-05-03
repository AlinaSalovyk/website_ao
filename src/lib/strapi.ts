/**
 * @deprecated
 * This file exists for backward compatibility only.
 * New code should import directly from '@/lib/strapi':
 *
 *   import { articleRepository } from '@/lib/strapi';
 *
 * This file will be removed in a future cleanup.
 */

// Import from the sub-modules directly to avoid circular reference
// (this file is '@/lib/strapi.ts', so it cannot re-export from '@/lib/strapi')
export { articleRepository, formatArticleDate } from '@/lib/strapi/index';
export type { Article, StrapiBlock } from '@/lib/strapi/types';

// Legacy function aliases — keep existing Astro page imports working
import { articleRepository } from '@/lib/strapi/index';

export const fetchAllArticles = () => articleRepository.findAll();
export const fetchLatestArticles = (count: number) => articleRepository.findLatest(count);
export const fetchArticleBySlug = (slug: string) => articleRepository.findBySlug(slug);
