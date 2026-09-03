import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { ExtractSheinUrlDto, CreateSheinOrderDto, UpdateSheinOrderStatusDto } from './dto/shein-order.dto';
import { SheinOrderStatus } from '@prisma/client';

@Injectable()
export class SheinService {
  private readonly logger = new Logger(SheinService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly settingsService: SettingsService,
  ) { }

  /**
   * Extract metadata from a SHEIN URL (OpenGraph / HTML scraper)
   */
  async extractMetadata(dto: ExtractSheinUrlDto) {
    const rawUrl = dto.url.trim();

    // Basic URL validation
    if (!rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) {
      throw new BadRequestException('يرجى إدخال رابط صحيح يبدأ بـ https://');
    }

    // Verify it is a SHEIN link
    const isShein = /shein\.(com|top|net)/i.test(rawUrl) || /ar\.shein\.com/i.test(rawUrl);
    if (!isShein) {
      throw new BadRequestException('الرابط المدخل ليس رابط منتج من موقع SHEIN');
    }

    try {
      // Follow redirects and fetch page with standard browser headers
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);

      const response = await fetch(rawUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept-Language': 'ar-EG,ar;q=0.9,en-US;q=0.8,en;q=0.7',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        },
        redirect: 'follow',
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const finalUrl = response.url || rawUrl;
      const html = await response.text();

      // 1. Extract Title
      let title = '';
      const ogTitleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["'](.*?)["']/i) ||
        html.match(/<meta\s+content=["'](.*?)["']\s+property=["']og:title["']/i);
      if (ogTitleMatch && ogTitleMatch[1]) {
        title = ogTitleMatch[1].trim();
      } else {
        const titleTagMatch = html.match(/<title>(.*?)<\/title>/i);
        if (titleTagMatch && titleTagMatch[1]) {
          title = titleTagMatch[1].replace(/\|\s*SHEIN.*$/i, '').trim();
        }
      }

      // 2. Extract Primary Image
      let imageUrl = '';
      const ogImageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["'](.*?)["']/i) ||
        html.match(/<meta\s+content=["'](.*?)["']\s+property=["']og:image["']/i);
      if (ogImageMatch && ogImageMatch[1]) {
        imageUrl = ogImageMatch[1].trim();
        if (imageUrl.startsWith('//')) imageUrl = 'https:' + imageUrl;
      }

      // 3. Extract Additional Images
      const images: string[] = [];
      if (imageUrl) images.push(imageUrl);
      const imgRegex = /https?:\/\/[^"'\s]+\.(?:jpg|jpeg|webp|png)/gi;
      const matches = html.match(imgRegex) || [];
      for (const m of matches) {
        if (m.includes('shein') && m.includes('/goods/') && !images.includes(m) && images.length < 5) {
          images.push(m);
        }
      }

      // 4. Extract Price
      let extractedPrice = 0;
      let currency = 'EGP';

      const ogPriceMatch = html.match(/<meta\s+property=["']product:price:amount["']\s+content=["'](.*?)["']/i) ||
        html.match(/<meta\s+content=["'](.*?)["']\s+property=["']product:price:amount["']/i);
      if (ogPriceMatch && ogPriceMatch[1]) {
        extractedPrice = parseFloat(ogPriceMatch[1]) || 0;
      }

      const ogCurrencyMatch = html.match(/<meta\s+property=["']product:price:currency["']\s+content=["'](.*?)["']/i);
      if (ogCurrencyMatch && ogCurrencyMatch[1]) {
        currency = ogCurrencyMatch[1].trim();
      }

      // If price not found via meta, look for price in script tags / JSON-LD
      if (!extractedPrice) {
        const jsonLdMatch = html.match(/<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/i);
        if (jsonLdMatch && jsonLdMatch[1]) {
          try {
            const data = JSON.parse(jsonLdMatch[1]);
            if (data.offers?.price) {
              extractedPrice = parseFloat(data.offers.price) || 0;
              if (data.offers.priceCurrency) currency = data.offers.priceCurrency;
            }
          } catch {
            // Ignore parse errors
          }
        }
      }

      // Fetch dynamic settings for fee calculation
      const settings = await this.settingsService.getPublicSettings();
      const exchangeRate = parseFloat(settings.shein_exchange_rate || '1') || 1;

      // Calculate estimated price in EGP
      let estimatedEgpPrice = extractedPrice > 0 ? Math.round(extractedPrice * exchangeRate) : 0;

      // Extract available sizes if possible from HTML
      const sizes: string[] = [];
      const sizeMatches = html.match(/"attr_value_name":"([^"]+)"/g);
      if (sizeMatches) {
        for (const sm of sizeMatches) {
          const val = sm.replace(/"attr_value_name":"([^"]+)"/, '$1');
          if (val && !sizes.includes(val) && sizes.length < 8) {
            sizes.push(val);
          }
        }
      }

      return {
        success: true,
        url: finalUrl,
        title: title || 'منتج من SHEIN',
        imageUrl: imageUrl || images[0] || null,
        images: images.length > 0 ? images : (imageUrl ? [imageUrl] : []),
        originalPrice: extractedPrice,
        currency,
        estimatedPriceEgp: estimatedEgpPrice,
        sizes: sizes.length > 0 ? sizes : ['S', 'M', 'L', 'XL'],
      };
    } catch (error: any) {
      this.logger.warn(`Failed to extract SHEIN URL metadata: ${error?.message || error}`);
      // Return a graceful response so user can still complete with manual inputs
      return {
        success: false,
        url: rawUrl,
        title: 'منتج من SHEIN',
        imageUrl: null,
        images: [],
        originalPrice: 0,
        currency: 'EGP',
        estimatedPriceEgp: 0,
        sizes: ['S', 'M', 'L', 'XL'],
        message: 'تعذر جلب تفاصيل الرابط تلقائياً بسبب حماية موقع SHEIN. يمكنك إدخال تفاصيل المنتج يدوياً وإتمام الطلب بسهولة!',
      };
    }
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

    const sheinShippingFee = pricing.shippingFee;
    const serviceFee = pricing.serviceFee;
    const deliveryFee = pricing.deliveryFee;
    const totalAmount = productsTotal + sheinShippingFee + serviceFee + deliveryFee;

    // Save order in PostgreSQL database via Prisma
    const order = await this.prisma.sheinOrder.create({
      data: {
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
      },
      include: {
        items: true,
      },
    });

    // Build WhatsApp confirmation message
    let whatsappText = `*طلب جديد من SHEIN #${order.orderNumber}*\n\n`;
    whatsappText += `👤 *الاسم:* ${order.customerName}\n`;
    whatsappText += `📱 *الهاتف:* ${order.customerPhone}\n`;
    if (order.customerCity) whatsappText += `📍 *المحافظة/العنوان:* ${order.customerCity} - ${order.customerAddress || ''}\n`;
    whatsappText += `\n🛍️ *المنتجات المطلوبة:* (${order.items.length})\n`;

    order.items.forEach((item: any, idx: number) => {
      whatsappText += `\n${idx + 1}. *${item.title}*\n`;
      whatsappText += `🔗 *الرابط:* ${item.productUrl}\n`;
      if (item.size) whatsappText += `📏 *المقاس:* ${item.size} | `;
      if (item.color) whatsappText += `🎨 *اللون:* ${item.color} | `;
      whatsappText += `🔢 *الكمية:* ${item.quantity}\n`;
      whatsappText += `💰 *السعر:* ${item.subtotal} ج.م\n`;
    });

    whatsappText += `\n💵 *إجمالي المنتجات:* ${order.productsTotal} ج.م\n`;
    whatsappText += `📦 *الشحن الدولي:* ${order.sheinShippingFee} ج.م\n`;
    whatsappText += `⚡ *رسوم الخدمة:* ${order.serviceFee} ج.م\n`;
    whatsappText += `🚚 *التوصيل المحلي:* ${order.deliveryFee} ج.م\n`;
    whatsappText += `\n💳 *الإجمالي الكلي التقديري:* ${order.totalAmount} ج.م\n`;

    const cleanPhone = (pricing.whatsappNumber || '').replace(/[^0-9]/g, '');
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(whatsappText)}`;

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
