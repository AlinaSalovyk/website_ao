import type { Core } from '@strapi/strapi';

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Server => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  url: env('PUBLIC_URL', ''), // Railway proxy public URL
  proxy: env.bool('PROXY', true), // Required for Railway / behind proxy
  app: {
    keys: env.array('APP_KEYS'),
  },
});

export default config;
