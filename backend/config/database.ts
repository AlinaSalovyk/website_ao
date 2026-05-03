import path from 'path';
import type { Core } from '@strapi/strapi';

export default ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Database => {
  const client = env('DATABASE_CLIENT', 'sqlite');

  if (client === 'postgres') {
    const databaseUrl = env('DATABASE_URL', '');
    
    // When DATABASE_URL is provided, we must pass ONLY connectionString and ssl.
    // If we pass 'host' or 'port', the pg driver will try to connect to localhost and fail.
    // We cast to `any` to bypass Strapi's strict TypeScript types that require host/port.
    const postgresConnection: any = databaseUrl 
      ? {
          connectionString: databaseUrl,
          ssl: { rejectUnauthorized: false },
        }
      : {
          host: env('DATABASE_HOST', 'localhost'),
          port: env.int('DATABASE_PORT', 5432),
          database: env('DATABASE_NAME', 'strapi'),
          user: env('DATABASE_USERNAME', 'strapi'),
          password: env('DATABASE_PASSWORD', ''),
          ssl: env.bool('DATABASE_SSL', false) ? { rejectUnauthorized: false } : false,
          schema: env('DATABASE_SCHEMA', 'public'),
        };

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
