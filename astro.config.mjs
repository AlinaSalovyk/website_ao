// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import react from '@astrojs/react';

import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://www.itb.oa.edu.ua',
  image: {
    domains: [
      'localhost',
      '127.0.0.1',
      'strapi-production-c58f.up.railway.app',
      'res.cloudinary.com',
    ],
  },
  vite: {
    plugins: [tailwindcss()],
    ssr: {
      noExternal: ['motion'],
    },
    optimizeDeps: {
      include: ['motion', 'motion/react'],
    },
  },
  i18n: {
    defaultLocale: 'uk',
    locales: ['uk', 'en'],
    routing: {
      prefixDefaultLocale: false,
    },
    fallback: {
      en: 'uk',
    },
  },
  integrations: [
    react(),
    sitemap({
      i18n: {
        defaultLocale: 'uk',
        locales: { uk: 'uk-UA', en: 'en-US' },
      },
    }),
  ],
});