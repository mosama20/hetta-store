import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Build the database URL with configurable connection pool settings.
 *
 * Environment variables:
 *   DATABASE_CONNECTION_LIMIT  — max connections per Prisma instance (default: 5)
 *   DATABASE_POOL_TIMEOUT      — seconds to wait for a connection (default: 10)
 *
 * NOTE: On Vercel/serverless each function instance opens its own pool.
 * With DATABASE_CONNECTION_LIMIT=5 and 10 concurrent instances, the effective
 * connection count is 50. Supabase transaction pooler (port 6543) supports
 * up to ~200 concurrent connections; adjust accordingly.
 */
function getOptimizedDatabaseUrl(): string | undefined {
  let url = process.env.DATABASE_URL;
  if (!url) return undefined;

  // Ensure Supabase transaction pooler compatibility
  if (url.includes('pooler.supabase.com')) {
    url = url.replace(':5432/', ':6543/');

    if (!url.includes('pgbouncer=true')) {
      const sep = url.includes('?') ? '&' : '?';
      url = `${url}${sep}pgbouncer=true`;
    }
  }

  // Apply configurable connection pool settings (never hardcode)
  const connectionLimit = process.env.DATABASE_CONNECTION_LIMIT || '5';
  const poolTimeout = process.env.DATABASE_POOL_TIMEOUT || '10';

  // Remove any existing connection_limit or pool_timeout params
  url = url.replace(/[&?]connection_limit=\d+/g, '');
  url = url.replace(/[&?]pool_timeout=\d+/g, '');

  const sep = url.includes('?') ? '&' : '?';
  url = `${url}${sep}connection_limit=${connectionLimit}&pool_timeout=${poolTimeout}`;

  return url;
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const url = getOptimizedDatabaseUrl();
    super(url ? { datasources: { db: { url } } } : undefined);
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this.logger.log('Prisma connected to PostgreSQL database successfully');
    } catch (error) {
      this.logger.warn(`Prisma deferred database connection: ${(error as Error).message}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
