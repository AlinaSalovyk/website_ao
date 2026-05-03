import path from 'path';
import type { Core } from '@strapi/strapi';

/**
 * Database configuration.
 *
 * Strategy:
 *  - Local dev  → SQLite (zero config, DATABASE_CLIENT defaults to 'sqlite')
 *  - Production → PostgreSQL on Railway (DATABASE_CLIENT=postgres, DATABASE_URL=…)
 *
 * The config object is an exhaustive map so TypeScript is happy without casts.
 * We read `client` first, then spread only the matching connection block.
 */

type SupportedClient = 'sqlite' | 'postgres' | 'mysql';

const config = ({
  env,
}: Core.Config.Shared.ConfigParams): Core.Config.Database => {
  const client = env<SupportedClient>('DATABASE_CLIENT', 'sqlite');

  const connections: Record<SupportedClient, object> = {
    // ── Local development ──────────────────────────────────────────────────
    sqlite: {
      connection: {
        // Resolves to: <project-root>/backend/.tmp/data.db
        filename: path.join(
          __dirname,
          '..',
          '..',
          env('DATABASE_FILENAME', '.tmp/data.db'),
        ),
      },
      useNullAsDefault: true,
    },

    // ── Production (Railway / any PostgreSQL host) ─────────────────────────
    postgres: {
      connection: {
        // Railway provides DATABASE_URL; individual fields are fallbacks.
        connectionString: env('DATABASE_URL'),
        host: env('DATABASE_HOST', 'localhost'),
        port: env.int('DATABASE_PORT', 5432),
        database: env('DATABASE_NAME', 'strapi'),
        user: env('DATABASE_USERNAME', 'strapi'),
        password: env('DATABASE_PASSWORD', ''),
        // Railway uses self-signed TLS certificates → rejectUnauthorized: false
        ssl: env.bool('DATABASE_SSL', false)
          ? { rejectUnauthorized: env.bool('DATABASE_SSL_SELF_SIGNED', false) ? false : true }
          : false,
        schema: env('DATABASE_SCHEMA', 'public'),
      },
      pool: {
        min: env.int('DATABASE_POOL_MIN', 2),
        max: env.int('DATABASE_POOL_MAX', 10),
      },
    },

    // ── MySQL (reserved, not used) ─────────────────────────────────────────
    mysql: {
      connection: {
        host: env('DATABASE_HOST', 'localhost'),
        port: env.int('DATABASE_PORT', 3306),
        database: env('DATABASE_NAME', 'strapi'),
        user: env('DATABASE_USERNAME', 'strapi'),
        password: env('DATABASE_PASSWORD', ''),
        ssl: env.bool('DATABASE_SSL', false),
      },
      pool: {
        min: env.int('DATABASE_POOL_MIN', 2),
        max: env.int('DATABASE_POOL_MAX', 10),
      },
    },
  };

  return {
    connection: {
      client,
      ...(connections[client] ?? connections.sqlite),
      acquireConnectionTimeout: env.int('DATABASE_CONNECTION_TIMEOUT', 60_000),
    },
  };
};

export default config;
