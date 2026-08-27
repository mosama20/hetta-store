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

      // Ensure analytics and abandoned carts tables exist seamlessly
      await this.ensureAnalyticsTables();
    } catch (error) {
      this.logger.warn(`Prisma deferred database connection: ${(error as Error).message}`);
    }
  }

  private async ensureAnalyticsTables(): Promise<void> {
    try {
      await this.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "visitor_sessions" (
          "id" UUID NOT NULL DEFAULT gen_random_uuid(),
          "session_id" VARCHAR(100) NOT NULL,
          "visitor_id" VARCHAR(100) NOT NULL,
          "ip_address" VARCHAR(45),
          "country" VARCHAR(100),
          "city" VARCHAR(100),
          "device_type" VARCHAR(20) NOT NULL DEFAULT 'desktop',
          "browser" VARCHAR(100) NOT NULL DEFAULT 'Unknown',
          "os" VARCHAR(100) NOT NULL DEFAULT 'Unknown',
          "screen_resolution" VARCHAR(50),
          "referrer" VARCHAR(255) NOT NULL DEFAULT 'Direct',
          "utm_source" VARCHAR(100),
          "utm_medium" VARCHAR(100),
          "utm_campaign" VARCHAR(100),
          "utm_content" VARCHAR(100),
          "utm_term" VARCHAR(100),
          "pages_visited" TEXT[] DEFAULT ARRAY[]::TEXT[],
          "total_page_views" INTEGER NOT NULL DEFAULT 1,
          "duration_seconds" INTEGER NOT NULL DEFAULT 0,
          "has_order" BOOLEAN NOT NULL DEFAULT false,
          "order_number" VARCHAR(50),
          "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "visitor_sessions_pkey" PRIMARY KEY ("id")
        );
        CREATE UNIQUE INDEX IF NOT EXISTS "visitor_sessions_session_id_key" ON "visitor_sessions"("session_id");
        CREATE INDEX IF NOT EXISTS "idx_visitor_sessions_session_id" ON "visitor_sessions"("session_id");
        CREATE INDEX IF NOT EXISTS "idx_visitor_sessions_visitor_id" ON "visitor_sessions"("visitor_id");
        CREATE INDEX IF NOT EXISTS "idx_visitor_sessions_ip_address" ON "visitor_sessions"("ip_address");
        CREATE INDEX IF NOT EXISTS "idx_visitor_sessions_created_at" ON "visitor_sessions"("created_at");

        CREATE TABLE IF NOT EXISTS "analytics_events" (
          "id" UUID NOT NULL DEFAULT gen_random_uuid(),
          "session_id" VARCHAR(100) NOT NULL,
          "visitor_id" VARCHAR(100) NOT NULL,
          "ip_address" VARCHAR(45),
          "event_type" VARCHAR(50) NOT NULL,
          "path" VARCHAR(255) NOT NULL,
          "payload" JSONB,
          "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
        );
        CREATE INDEX IF NOT EXISTS "idx_analytics_events_session_id" ON "analytics_events"("session_id");
        CREATE INDEX IF NOT EXISTS "idx_analytics_events_visitor_id" ON "analytics_events"("visitor_id");
        CREATE INDEX IF NOT EXISTS "idx_analytics_events_event_type" ON "analytics_events"("event_type");
        CREATE INDEX IF NOT EXISTS "idx_analytics_events_created_at" ON "analytics_events"("created_at");

        CREATE TABLE IF NOT EXISTS "abandoned_carts" (
          "id" UUID NOT NULL DEFAULT gen_random_uuid(),
          "session_id" VARCHAR(100) NOT NULL,
          "visitor_id" VARCHAR(100) NOT NULL,
          "ip_address" VARCHAR(45),
          "device_type" VARCHAR(20) NOT NULL DEFAULT 'desktop',
          "items" JSONB NOT NULL,
          "items_count" INTEGER NOT NULL DEFAULT 0,
          "total_value" DECIMAL(10,2) NOT NULL,
          "currency" VARCHAR(10) NOT NULL DEFAULT 'EGP',
          "is_recovered" BOOLEAN NOT NULL DEFAULT false,
          "last_active_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "abandoned_carts_pkey" PRIMARY KEY ("id")
        );
        CREATE INDEX IF NOT EXISTS "idx_abandoned_carts_session_id" ON "abandoned_carts"("session_id");
        CREATE INDEX IF NOT EXISTS "idx_abandoned_carts_visitor_id" ON "abandoned_carts"("visitor_id");
        CREATE INDEX IF NOT EXISTS "idx_abandoned_carts_is_recovered" ON "abandoned_carts"("is_recovered");
        CREATE INDEX IF NOT EXISTS "idx_abandoned_carts_created_at" ON "abandoned_carts"("created_at");
      `);
      this.logger.log('Analytics and abandoned carts tables verified in PostgreSQL');
    } catch (e: any) {
      this.logger.warn(`Could not verify analytics tables: ${e?.message || e}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
