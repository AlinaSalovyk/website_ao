import path from 'path';
import type { Core } from '@strapi/strapi';

/**
 * Database configuration.
 *
 * Local dev  → SQLite  (DATABASE_CLIENT=sqlite, default)
 * Production → PostgreSQL on Railway (DATABASE_CLIENT=postgres, DATABASE_URL=…)
 *
 * When DATABASE_URL is set, `pg` uses connectionString and ignores
 * individual host/port/etc fields — but Strapi's TypeScript types require
 * them to be present, so we provide safe defaults.
 *
 * SSL: Railway uses a self-signed certificate → rejectUnauthorized: false.
 */

type SupportedClient = 'sqlite' | 'postgres' | 'mysql';

const config = ({
  env,
}: Core.Config.Shared.ConfigParams): Core.Config.Database => {
  const client = env<SupportedClient>('DATABASE_CLIENT', 'sqlite');

  // DATABASE_URL is provided automatically by Railway when PostgreSQL addon is added.
  const databaseUrl = env('DATABASE_URL', '');

  const connections: Record<SupportedClient, object> = {
    // ── Local development ──────────────────────────────────────────────────
    sqlite: {
      connection: {
        filename: path.join(
          __dirname,
          '..',
          '..',
          env('DATABASE_FILENAME', '.tmp/data.db'),
        ),
      },
      useNullAsDefault: true,
    },

    // ── Production (Railway / any PostgreSQL) ──────────────────────────────
    postgres: {
      connection: {
        // connectionString takes precedence in `pg` when provided.
        // Individual fields below satisfy Strapi's TypeScript types.
        connectionString: databaseUrl || undefined,
        host: env('DATABASE_HOST', 'localhost'),
        port: env.int('DATABASE_PORT', 5432),
        database: env('DATABASE_NAME', 'strapi'),
        user: env('DATABASE_USERNAME', 'strapi'),
        password: env('DATABASE_PASSWORD', ''),
        // Railway PostgreSQL always uses a self-signed TLS certificate.
        ssl: databaseUrl
          ? { rejectUnauthorized: false }
          : env.bool('DATABASE_SSL', false)
            ? { rejectUnauthorized: false }
            : false,
        schema: env('DATABASE_SCHEMA', 'public'),
      },
      pool: {
        min: env.int('DATABASE_POOL_MIN', 2),
        max: env.int('DATABASE_POOL_MAX', 10),
      },
    },

    // ── MySQL (reserved) ───────────────────────────────────────────────────
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
