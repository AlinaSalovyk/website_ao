import { factories } from '@strapi/strapi';

/**
 * Article controller.
 *
 * Uses Strapi's factory to inherit all standard CRUD operations.
 * Custom behaviour (e.g. response transformation) can be added here
 * by overriding individual actions.
 */
export default factories.createCoreController(
  'api::article.article',
);
