-- CreateEnum
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'shein_order_status') THEN
        CREATE TYPE "shein_order_status" AS ENUM ('PENDING', 'CONFIRMED', 'PURCHASED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED');
    END IF;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "shein_orders" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_number" VARCHAR(35) NOT NULL,
    "customer_name" VARCHAR(150) NOT NULL,
    "customer_phone" VARCHAR(30) NOT NULL,
    "customer_city" VARCHAR(100),
    "customer_district" VARCHAR(100),
    "customer_address" TEXT,
    "payment_method" VARCHAR(50) NOT NULL DEFAULT 'CASH_ON_DELIVERY',
    "notes" TEXT,
    "status" "shein_order_status" NOT NULL DEFAULT 'PENDING',
    "products_total" DECIMAL(10,2) NOT NULL,
    "shein_shipping_fee" DECIMAL(10,2) NOT NULL,
    "service_fee" DECIMAL(10,2) NOT NULL,
    "delivery_fee" DECIMAL(10,2) NOT NULL,
    "total_amount" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'EGP',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shein_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "shein_order_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id" UUID NOT NULL,
    "product_url" TEXT NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "image_url" TEXT,
    "color" VARCHAR(50),
    "size" VARCHAR(30),
    "unit_price" DECIMAL(10,2) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shein_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndexes
CREATE UNIQUE INDEX IF NOT EXISTS "shein_orders_order_number_key" ON "shein_orders"("order_number");
CREATE INDEX IF NOT EXISTS "idx_shein_orders_order_number" ON "shein_orders"("order_number");
CREATE INDEX IF NOT EXISTS "idx_shein_orders_customer_phone" ON "shein_orders"("customer_phone");
CREATE INDEX IF NOT EXISTS "idx_shein_orders_status" ON "shein_orders"("status");
CREATE INDEX IF NOT EXISTS "idx_shein_orders_created_at" ON "shein_orders"("created_at");

CREATE INDEX IF NOT EXISTS "idx_shein_order_items_order_id" ON "shein_order_items"("order_id");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'shein_order_items_order_id_fkey'
    ) THEN
        ALTER TABLE "shein_order_items" ADD CONSTRAINT "shein_order_items_order_id_fkey" 
        FOREIGN KEY ("order_id") REFERENCES "shein_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
