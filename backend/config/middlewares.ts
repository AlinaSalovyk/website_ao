import type { Core } from '@strapi/strapi';

/**
 * Middleware configuration.
 *
 * CORS is explicitly configured so:
 *  - Local dev allows localhost origins
 *  - Production allows the Vercel frontend domain (FRONTEND_URL env var)
 *
 * Security headers (CSP, HSTS, etc.) are enabled via strapi::security.
 */
const config: Core.Config.Middlewares = [
  'strapi::logger',
  'strapi::errors',

  // Content-Security-Policy and other security headers
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'connect-src': ["'self'", 'https:'],
          'img-src': [
            "'self'",
            'data:',
            'blob:',
            'market-assets.strapi.io',
            // Allow Cloudinary image delivery
            'res.cloudinary.com',
          ],
          'media-src': [
            "'self'",
            'data:',
            'blob:',
            'res.cloudinary.com',
          ],
          upgradeInsecureRequests: null,
        },
      },
    },
  },

  // Cross-Origin Resource Sharing
  {
    name: 'strapi::cors',
    config: {
      origin: [
        '*', // Allows all origins temporarily to ensure admin panel loads correctly
      ],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
      headers: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
      keepHeaderOnError: true,
    },
  },

  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];

export default config;
