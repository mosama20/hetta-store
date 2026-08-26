import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

function getOptimizedDatabaseUrl(): string | undefined {
  let url = process.env.DATABASE_URL;
  if (!url) return undefined;

  // If connecting to Supabase pooler, ensure transaction mode and connection_limit=1
  if (url.includes('pooler.supabase.com')) {
    // If port 5432 is used with pooler, switch to 6543 for transaction pooling to avoid session limits
    url = url.replace(':5432/', ':6543/');

    if (!url.includes('pgbouncer=true')) {
      const sep = url.includes('?') ? '&' : '?';
      url = `${url}${sep}pgbouncer=true`;
    }
  }

  // Ensure connection limit is restricted to 1 on serverless to avoid EMAXCONNSESSION (max 15 clients)
  if (!url.includes('connection_limit=')) {
    const sep = url.includes('?') ? '&' : '?';
    url = `${url}${sep}connection_limit=1&pool_timeout=25`;
  }

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
      this.logger.log('Prisma connected to PostgreSQL database successfully (Supabase Optimized)');
    } catch (error) {
      this.logger.warn(`Prisma deferred database connection: ${(error as Error).message}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
