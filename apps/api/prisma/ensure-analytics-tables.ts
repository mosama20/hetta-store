import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Ensuring analytics and abandoned_carts tables exist in PostgreSQL...');

  // 1. visitor_sessions
  await prisma.$executeRawUnsafe(`
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
  `);
  await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "visitor_sessions_session_id_key" ON "visitor_sessions"("session_id");`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "idx_visitor_sessions_session_id" ON "visitor_sessions"("session_id");`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "idx_visitor_sessions_visitor_id" ON "visitor_sessions"("visitor_id");`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "idx_visitor_sessions_ip_address" ON "visitor_sessions"("ip_address");`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "idx_visitor_sessions_created_at" ON "visitor_sessions"("created_at");`);
  console.log('✓ visitor_sessions table and indexes ready');

  // 2. analytics_events
  await prisma.$executeRawUnsafe(`
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
  `);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "idx_analytics_events_session_id" ON "analytics_events"("session_id");`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "idx_analytics_events_visitor_id" ON "analytics_events"("visitor_id");`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "idx_analytics_events_event_type" ON "analytics_events"("event_type");`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "idx_analytics_events_created_at" ON "analytics_events"("created_at");`);
  console.log('✓ analytics_events table and indexes ready');

  // 3. abandoned_carts
  await prisma.$executeRawUnsafe(`
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
  `);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "idx_abandoned_carts_session_id" ON "abandoned_carts"("session_id");`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "idx_abandoned_carts_visitor_id" ON "abandoned_carts"("visitor_id");`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "idx_abandoned_carts_is_recovered" ON "abandoned_carts"("is_recovered");`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "idx_abandoned_carts_created_at" ON "abandoned_carts"("created_at");`);
  console.log('✓ abandoned_carts table and indexes ready');

  console.log('All analytics tables successfully verified and created!');
}

main()
  .catch((e) => {
    console.error('Error ensuring analytics tables:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
