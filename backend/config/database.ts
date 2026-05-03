import path from 'path';
import type { Core } from '@strapi/strapi';

/**
 * Database configuration.
 *
 * Strategy:
 *  - Local dev  → SQLite  (DATABASE_CLIENT=sqlite, default)
 *  - Production → PostgreSQL on Railway via DATABASE_URL
 *
 * When DATABASE_URL is present we pass ONLY connectionString + ssl.
 * Mixing connectionString with host/port/user causes AggregateError in knex.
 */
const config = ({
  env,
}: Core.Config.Shared.ConfigParams): Core.Config.Database => {
  const client = env('DATABASE_CLIENT', 'sqlite');

  // ── SQLite (local development) ─────────────────────────────────────────
  if (client === 'sqlite') {
    return {
      connection: {
        client: 'sqlite',
        connection: {
          filename: path.join(
            __dirname,
            '..',
            '..',
            env('DATABASE_FILENAME', '.tmp/data.db'),
          ),
        },
        useNullAsDefault: true,
        acquireConnectionTimeout: env.int('DATABASE_CONNECTION_TIMEOUT', 60_000),
      },
    };
  }

  // ── PostgreSQL (Railway production) ────────────────────────────────────
  // Railway provides DATABASE_URL automatically.
  // Use ONLY connectionString — never mix with host/port/user.
  const databaseUrl = env('DATABASE_URL', '');

  return {
    connection: {
      client: 'postgres',
      connection: databaseUrl
        ? {
            // Railway DATABASE_URL already contains host, port, user, password, dbname
            connectionString: databaseUrl,
            // Railway PostgreSQL requires SSL; certificate is self-signed
            ssl: { rejectUnauthorized: false },
          }
        : {
            // Fallback: individual fields (for non-Railway postgres)
            host: env('DATABASE_HOST', 'localhost'),
            port: env.int('DATABASE_PORT', 5432),
            database: env('DATABASE_NAME', 'strapi'),
            user: env('DATABASE_USERNAME', 'strapi'),
            password: env('DATABASE_PASSWORD', ''),
            ssl: env.bool('DATABASE_SSL', false)
              ? { rejectUnauthorized: false }
              : false,
            schema: env('DATABASE_SCHEMA', 'public'),
          },
      pool: {
        min: env.int('DATABASE_POOL_MIN', 2),
        max: env.int('DATABASE_POOL_MAX', 10),
      },
      acquireConnectionTimeout: env.int('DATABASE_CONNECTION_TIMEOUT', 60_000),
    },
  };
};

export default config;
