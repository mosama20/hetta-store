import { Injectable, BadRequestException, NotFoundException, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { ExtractSheinUrlDto, CreateSheinOrderDto, UpdateSheinOrderStatusDto } from './dto/shein-order.dto';
import { SheinOrderStatus } from '@prisma/client';

@Injectable()
export class SheinService implements OnModuleInit {
  private readonly logger = new Logger(SheinService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly settingsService: SettingsService,
  ) { }

  async onModuleInit() {
    await this.ensureSheinTables();
  }

  /**
   * Self-healing: verify and create shein_orders tables if missing in database
   */
  async ensureSheinTables() {
    try {
      await this.prisma.$executeRawUnsafe(`
        DO $$ 
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'shein_order_status') THEN
                CREATE TYPE "shein_order_status" AS ENUM ('PENDING', 'CONFIRMED', 'PURCHASED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED');
            END IF;
        END $$;
      `);

      await this.prisma.$executeRawUnsafe(`
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
      `);

      await this.prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "shein_orders_order_number_key" ON "shein_orders"("order_number");`);
      await this.prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "idx_shein_orders_order_number" ON "shein_orders"("order_number");`);
      await this.prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "idx_shein_orders_customer_phone" ON "shein_orders"("customer_phone");`);
      await this.prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "idx_shein_orders_status" ON "shein_orders"("status");`);
      await this.prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "idx_shein_orders_created_at" ON "shein_orders"("created_at");`);

      await this.prisma.$executeRawUnsafe(`
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
      `);

      await this.prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "idx_shein_order_items_order_id" ON "shein_order_items"("order_id");`);

      await this.prisma.$executeRawUnsafe(`
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint WHERE conname = 'shein_order_items_order_id_fkey'
            ) THEN
                ALTER TABLE "shein_order_items" ADD CONSTRAINT "shein_order_items_order_id_fkey" 
                FOREIGN KEY ("order_id") REFERENCES "shein_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
            END IF;
        END $$;
      `);

      this.logger.log('✓ Verified and ensured shein_orders tables exist in database');
    } catch (err: any) {
      this.logger.warn(`Could not ensure SHEIN tables via raw SQL: ${err?.message || err}`);
    }
  }

  /**
   * Extract metadata from a SHEIN URL (Smart URL sanitizer, redirect resolver, slug parser, and HTML scraper)
   */
  async extractMetadata(dto: ExtractSheinUrlDto) {
    const rawInput = (dto.url || '').trim();

    // 1. Sanitize & extract URL from any pasted text (handles text copied from the SHEIN mobile app)
    const urlMatch = rawInput.match(/(https?:\/\/[^\s]+)/i);
    if (!urlMatch) {
      throw new BadRequestException('يرجى إدخال رابط صحيح لمنتج SHEIN');
    }

    let targetUrl = urlMatch[1].trim();

    // 2. Verify it is a valid SHEIN domain
    const isShein = /shein\.(com|top|net)/i.test(targetUrl) || /ar\.shein\.com/i.test(targetUrl);
    if (!isShein) {
      throw new BadRequestException('الرابط المدخل ليس رابط منتج من موقع SHEIN');
    }

    // 3. Resolve shortlinks / appjump links (shein.top, sharejump)
    try {
      if (targetUrl.includes('shein.top') || targetUrl.includes('sharejump') || targetUrl.includes('appjump')) {
        const headRes = await fetch(targetUrl, {
          method: 'GET',
          redirect: 'manual',
          headers: {
            'User-Agent':
              'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
          },
        });
        const loc = headRes.headers.get('location');
        if (loc && loc.startsWith('http')) {
          targetUrl = loc;
        }
      }
    } catch {
      // Ignore redirect resolution error and continue with targetUrl
    }

    // 4. Extract Goods ID from URL structure
    let goodsId = '';
    const goodsMatch =
      targetUrl.match(/-p-(\d+)/i) ||
      targetUrl.match(/goods_id=(\d+)/i) ||
      targetUrl.match(/goods-p-(\d+)/i) ||
      targetUrl.match(/item_id=(\d+)/i);
    if (goodsMatch && goodsMatch[1]) {
      goodsId = goodsMatch[1];
    }

    // 5. Extract Product Name Slug from URL
    let slugTitle = '';
    const slugMatch = targetUrl.match(/\/([^\/?#]+)-p-\d+/i);
    if (slugMatch && slugMatch[1] && slugMatch[1].toLowerCase() !== 'goods' && slugMatch[1].toLowerCase() !== 'pd') {
      try {
        slugTitle = decodeURIComponent(slugMatch[1]).replace(/[-_]/g, ' ').trim();
      } catch {
        slugTitle = slugMatch[1].replace(/[-_]/g, ' ').trim();
      }
    }

    // 6. Attempt page fetch for OpenGraph tags (with short timeout)
    let extractedTitle = '';
    let imageUrl: string | null = null;
    const images: string[] = [];
    let extractedPrice = 0;
    let currency = 'EGP';
    const scrapedSizes: string[] = [];

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);

      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept-Language': 'ar-EG,ar;q=0.9,en-US;q=0.8,en;q=0.7',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Referer': 'https://www.google.com/',
        },
        redirect: 'follow',
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const html = await response.text();

      // Ensure response is not a Cloudflare/Akamai bot challenge page
      if (!html.includes('risk/challenge') && !html.includes('Just a moment...') && !html.includes('cf-browser-verification')) {
        // Extract Title
        const ogTitleMatch =
          html.match(/<meta\s+property=["']og:title["']\s+content=["'](.*?)["']/i) ||
          html.match(/<meta\s+content=["'](.*?)["']\s+property=["']og:title["']/i);
        if (ogTitleMatch && ogTitleMatch[1] && !ogTitleMatch[1].includes('شي إن |')) {
          extractedTitle = ogTitleMatch[1].trim();
        } else {
          const titleTagMatch = html.match(/<title>(.*?)<\/title>/i);
          if (titleTagMatch && titleTagMatch[1] && !titleTagMatch[1].includes('شي إن |')) {
            extractedTitle = titleTagMatch[1].replace(/\|\s*SHEIN.*$/i, '').trim();
          }
        }

        // Extract Image
        const ogImageMatch =
          html.match(/<meta\s+property=["']og:image["']\s+content=["'](.*?)["']/i) ||
          html.match(/<meta\s+content=["'](.*?)["']\s+property=["']og:image["']/i);
        if (ogImageMatch && ogImageMatch[1]) {
          imageUrl = ogImageMatch[1].trim();
          if (imageUrl.startsWith('//')) imageUrl = 'https:' + imageUrl;
          images.push(imageUrl);
        }

        // Extract Price
        const ogPriceMatch =
          html.match(/<meta\s+property=["']product:price:amount["']\s+content=["'](.*?)["']/i) ||
          html.match(/<meta\s+content=["'](.*?)["']\s+property=["']product:price:amount["']/i);
        if (ogPriceMatch && ogPriceMatch[1]) {
          extractedPrice = parseFloat(ogPriceMatch[1]) || 0;
        }

        const ogCurrencyMatch = html.match(/<meta\s+property=["']product:price:currency["']\s+content=["'](.*?)["']/i);
        if (ogCurrencyMatch && ogCurrencyMatch[1]) {
          currency = ogCurrencyMatch[1].trim();
        }

        // Extract sizes if in HTML
        const sizeMatches = html.match(/"attr_value_name":"([^"]+)"/g);
        if (sizeMatches) {
          for (const sm of sizeMatches) {
            const val = sm.replace(/"attr_value_name":"([^"]+)"/, '$1');
            if (val && !scrapedSizes.includes(val) && scrapedSizes.length < 8) {
              scrapedSizes.push(val);
            }
          }
        }
      }
    } catch {
      // Ignore network / scrape errors gracefully
    }

    // Determine best available title
    const finalTitle =
      extractedTitle ||
      slugTitle ||
      (goodsId ? `منتج SHEIN (#${goodsId})` : 'منتج من SHEIN');

    // Fetch dynamic exchange rate & fees
    const settings = await this.settingsService.getPublicSettings();
    const exchangeRate = parseFloat(settings.shein_exchange_rate || '1') || 1;
    const estimatedPriceEgp = extractedPrice > 0 ? Math.round(extractedPrice * exchangeRate) : 0;

    const finalSizes = scrapedSizes.length > 0 ? scrapedSizes : ['S', 'M', 'L', 'XL', 'XXL', 'Free Size'];

    return {
      success: true,
      url: targetUrl,
      goodsId: goodsId || undefined,
      title: finalTitle,
      imageUrl: imageUrl || null,
      images: images.length > 0 ? images : imageUrl ? [imageUrl] : [],
      originalPrice: extractedPrice,
      currency,
      estimatedPriceEgp,
      sizes: finalSizes,
      message: 'تم التحقق من الرابط بنجاح! يمكنك تأكيد اسم المنتج وتحديد المقاس واللون والسعر لإتمام الطلب.',
    };
  }

  /**
   * Get dynamic pricing rules configured in admin settings
   */
  async getPricingConfig() {
    const settings = await this.settingsService.getPublicSettings();
    return {
      enabled: settings.shein_enabled !== 'false',
      shippingFee: parseFloat(settings.shein_shipping_fee || '100') || 100,
      serviceFee: parseFloat(settings.shein_service_fee || '75') || 75,
      deliveryFee: parseFloat(settings.shein_delivery_fee || '60') || 60,
      exchangeRate: parseFloat(settings.shein_exchange_rate || '1') || 1,
      estimatedDays: settings.shein_estimated_days || '10-15 يوم عمل',
      whatsappNumber: settings.whatsapp_number || '+201234567890',
    };
  }

  /**
   * Create a new SHEIN concierge order
   */
  async createOrder(dto: CreateSheinOrderDto) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('يجب إضافة منتج واحد على الأقل من SHEIN لإتمام الطلب');
    }

    const pricing = await this.getPricingConfig();
    if (!pricing.enabled) {
      throw new BadRequestException('خدمة الطلب من SHEIN متوقفة حالياً للصيانة');
    }

    // Generate unique order number
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `SHN-${timestamp}-${random}`;

    // Calculate totals
    let productsTotal = 0;
    const orderItems = dto.items.map((item) => {
      const unitPrice = item.unitPrice || 0;
      const quantity = Math.max(1, item.quantity || 1);
      const subtotal = unitPrice * quantity;
      productsTotal += subtotal;

      return {
        productUrl: item.productUrl,
        title: item.title,
        imageUrl: item.imageUrl || null,
        color: item.color || null,
        size: item.size || null,
        unitPrice,
        quantity,
        subtotal,
        notes: item.notes || null,
      };
    });

    // No extra fee inflations: total is direct converted amount of products
    const sheinShippingFee = 0;
    const serviceFee = 0;
    const deliveryFee = 0;
    const totalAmount = productsTotal;

    // Save order in PostgreSQL database via Prisma (with self-healing fallback)
    const orderData = {
      orderNumber,
      customerName: dto.customerName,
      customerPhone: dto.customerPhone,
      customerCity: dto.customerCity || null,
      customerDistrict: dto.customerDistrict || null,
      customerAddress: dto.customerAddress || null,
      paymentMethod: dto.paymentMethod || 'CASH_ON_DELIVERY',
      notes: dto.notes || null,
      status: SheinOrderStatus.PENDING,
      productsTotal,
      sheinShippingFee,
      serviceFee,
      deliveryFee,
      totalAmount,
      currency: 'EGP',
      items: {
        create: orderItems,
      },
    };

    let order;
    try {
      order = await this.prisma.sheinOrder.create({
        data: orderData,
        include: {
          items: true,
        },
      });
    } catch (createErr: any) {
      this.logger.warn(`Failed to create SHEIN order on first attempt: ${createErr?.message}. Ensuring tables exist...`);
      await this.ensureSheinTables();
      order = await this.prisma.sheinOrder.create({
        data: orderData,
        include: {
          items: true,
        },
      });
    }

    this.logger.log(`Created SHEIN order ${order.orderNumber} for customer ${order.customerName}`);

    // Fetch dynamic WhatsApp SHEIN template & store name from StoreSettings
    const [sheinTemplateSetting, storeNameSetting] = await Promise.all([
      this.prisma.storeSetting.findUnique({ where: { key: 'whatsapp_shein_template_ar' } }),
      this.prisma.storeSetting.findUnique({ where: { key: 'store_name_ar' } }),
    ]);

    const storeName = storeNameSetting?.value || 'حته ستور';
    const exchangeRate = pricing.exchangeRate > 0 ? pricing.exchangeRate : 13.2;
    const totalSar = Math.round((productsTotal / exchangeRate) * 100) / 100;

    const itemsSummary = order.items
      .map((item: any, idx: number) => {
        const itemSar = Math.round((Number(item.subtotal) / exchangeRate) * 100) / 100;
        let line = `${idx + 1}. *${item.title}*\n🔗 ${item.productUrl}`;
        const specs = [];
        if (item.size) specs.push(`المقاس: ${item.size}`);
        if (item.color) specs.push(`اللون: ${item.color}`);
        specs.push(`الكمية: ${item.quantity}`);
        line += `\n📏 ${specs.join(' | ')}`;
        line += `\n💰 السعر: ${item.subtotal} ج.م (~${itemSar} ر.س)`;
        if (item.notes) line += `\n📌 ملاحظات: ${item.notes}`;
        return line;
      })
      .join('\n\n');

    const defaultTemplate =
      '🛍️ *طلب استيراد جديد من SHEIN - {storeName}*\n' +
      '📋 *رقم الطلب:* #{orderNumber}\n\n' +
      '👤 *اسم العميل:* {customerName}\n' +
      '📱 *رقم الهاتف:* {customerPhone}\n' +
      '📍 *العنوان:* {customerAddress}\n' +
      '📝 *ملاحظات الشحن:* {notes}\n\n' +
      '👗 *المنتجات المطلوبة من شي إن:* ({itemsCount})\n\n' +
      '{itemsSummary}\n\n' +
      '─────────────────\n' +
      '🇸🇦 *الإجمالي بالريال السعودي:* {totalSar} ر.س\n' +
      '💵 *الإجمالي المحول بالجنيه المصري:* {total} {currency}\n' +
      '⏱️ *مدة التوصيل:* {estimatedDays}';

    const rawTemplate = sheinTemplateSetting?.value?.trim() || defaultTemplate;
    const fullAddress = [order.customerCity, order.customerAddress].filter(Boolean).join(' - ') || 'غير محدد';

    const generatedMessage = rawTemplate
      .replace(/\{storeName\}/gi, storeName)
      .replace(/\{orderNumber\}/gi, order.orderNumber)
      .replace(/\{customerName\}/gi, order.customerName || '')
      .replace(/\{customerPhone\}/gi, order.customerPhone || '')
      .replace(/\{customerAddress\}/gi, fullAddress)
      .replace(/\{address\}/gi, fullAddress)
      .replace(/\{city\}/gi, order.customerCity || '')
      .replace(/\{itemsCount\}/gi, String(order.items.length))
      .replace(/\{itemsSummary\}/gi, itemsSummary)
      .replace(/\{items\}/gi, itemsSummary)
      .replace(/\{products\}/gi, itemsSummary)
      .replace(/\{totalSar\}/gi, String(totalSar))
      .replace(/\{total\}/gi, String(order.totalAmount))
      .replace(/\{currency\}/gi, order.currency || 'EGP')
      .replace(/\{notes\}/gi, order.notes || 'لا يوجد')
      .replace(/\{exchangeRate\}/gi, String(exchangeRate))
      .replace(/\{estimatedDays\}/gi, pricing.estimatedDays || '10-15 يوم عمل');

    const cleanPhone = (pricing.whatsappNumber || '').replace(/[^0-9]/g, '');
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(generatedMessage)}`;

    return {
      success: true,
      order,
      whatsappUrl,
    };
  }

  /**
   * Admin: List all SHEIN orders
   */
  async findAllOrders(query: {
    page?: number;
    limit?: number;
    status?: SheinOrderStatus;
    search?: string;
  }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 15));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) {
      where.status = query.status;
    }
    if (query.search) {
      where.OR = [
        { orderNumber: { contains: query.search, mode: 'insensitive' } },
        { customerName: { contains: query.search, mode: 'insensitive' } },
        { customerPhone: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.sheinOrder.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: true,
        },
      }),
      this.prisma.sheinOrder.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Admin: Get order details by ID
   */
  async findOneOrder(id: string) {
    const order = await this.prisma.sheinOrder.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });
    if (!order) {
      throw new NotFoundException('طلب SHEIN غير موجود');
    }
    return order;
  }

  /**
   * Admin: Update order status
   */
  async updateOrderStatus(id: string, dto: UpdateSheinOrderStatusDto) {
    const order = await this.prisma.sheinOrder.findUnique({ where: { id } });
    if (!order) {
      throw new NotFoundException('طلب SHEIN غير موجود');
    }

    return this.prisma.sheinOrder.update({
      where: { id },
      data: { status: dto.status as SheinOrderStatus },
      include: { items: true },
    });
  }

  /**
   * Admin: Delete a SHEIN order
   */
  async deleteOrder(id: string) {
    const order = await this.prisma.sheinOrder.findUnique({ where: { id } });
    if (!order) {
      throw new NotFoundException('طلب SHEIN غير موجود');
    }

    await this.prisma.sheinOrder.delete({ where: { id } });
    return { success: true, message: 'تم حذف الطلب بنجاح' };
  }
}
