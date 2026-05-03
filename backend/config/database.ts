import path from 'path';
import type { Core } from '@strapi/strapi';

export default ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Database => {
  const client = env('DATABASE_CLIENT', 'sqlite');

  if (client === 'postgres') {
    const databaseUrl = env('DATABASE_URL', '');
    let postgresConnection: any = {};

    console.log('[DATABASE CONFIG] CLIENT: postgres');
    console.log('[DATABASE CONFIG] DATABASE_URL IS:', databaseUrl ? 'PRESENT' : 'EMPTY!');

    if (databaseUrl) {
      // Manually parse the URL to avoid any connectionString bugs in knex/pg
      const url = new URL(databaseUrl);
      postgresConnection = {
        host: url.hostname,
        port: url.port ? parseInt(url.port, 10) : 5432,
        database: url.pathname.replace(/^\//, ''),
        user: url.username,
        password: url.password,
        ssl: { rejectUnauthorized: false },
        schema: env('DATABASE_SCHEMA', 'public'),
      };
      console.log(`[DATABASE CONFIG] Parsed Host: ${url.hostname}, Port: ${postgresConnection.port}, DB: ${postgresConnection.database}`);
    } else {
      postgresConnection = {
        host: env('DATABASE_HOST', 'localhost'),
        port: env.int('DATABASE_PORT', 5432),
        database: env('DATABASE_NAME', 'strapi'),
        user: env('DATABASE_USERNAME', 'strapi'),
        password: env('DATABASE_PASSWORD', ''),
        ssl: env.bool('DATABASE_SSL', false) ? { rejectUnauthorized: false } : false,
        schema: env('DATABASE_SCHEMA', 'public'),
      };
    }

    return {
      connection: {
        client: 'postgres',
        connection: postgresConnection,
        pool: {
          min: env.int('DATABASE_POOL_MIN', 2),
          max: env.int('DATABASE_POOL_MAX', 10),
        },
        acquireConnectionTimeout: env.int('DATABASE_CONNECTION_TIMEOUT', 60000),
      },
    };
  }

  // Fallback to SQLite for local development
  return {
    connection: {
      client: 'sqlite',
      connection: {
        filename: path.join(__dirname, '..', '..', env('DATABASE_FILENAME', '.tmp/data.db')),
      } as any,
      useNullAsDefault: true,
      acquireConnectionTimeout: env.int('DATABASE_CONNECTION_TIMEOUT', 60000),
    },
  };
};
