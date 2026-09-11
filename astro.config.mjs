// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import react from '@astrojs/react';

import sitemap from '@astrojs/sitemap';

import node from '@astrojs/node';
import vercel from '@astrojs/vercel';

const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV !== undefined;

// https://astro.build/config
export default defineConfig({
  // server mode: most pages use `export const prerender = true` (static),
  // news pages use `export const prerender = false` (SSR on every request).
  output: 'server',
  adapter: isVercel ? vercel() : node({ mode: 'standalone' }),
  site: 'https://www.itb.oa.edu.ua',
  vite: {
    plugins: [tailwindcss()],
    server: {
      proxy: {
        '/news-images': 'http://localhost:8280',
        '/news-videos': 'http://localhost:8280',
      },
    },
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