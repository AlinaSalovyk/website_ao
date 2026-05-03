import { factories } from '@strapi/strapi';

/**
 * Article routes.
 *
 * Generates standard REST routes:
 *   GET    /api/articles          → find (list)
 *   GET    /api/articles/:id      → findOne
 *   POST   /api/articles          → create
 *   PUT    /api/articles/:id      → update
 *   DELETE /api/articles/:id      → delete
 *
 * Public read access is granted via:
 *   Admin → Settings → Users & Permissions → Public → article → find + findOne
 */
export default factories.createCoreRouter('api::article.article');
