import { factories } from '@strapi/strapi';

/**
 * Article service.
 *
 * Business logic layer, separate from HTTP concerns (controller).
 * Factory provides: find, findOne, create, update, delete.
 */
export default factories.createCoreService(
  'api::article.article',
);
