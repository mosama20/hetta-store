import { Injectable, BadRequestException } from '@nestjs/common';
import { SettingGroup, CMSSectionType, DiscountType, OrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CacheService } from '../common/cache/cache.service';

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly cache: CacheService,
  ) { }

  async getPublicSettings() {
    const cacheKey = 'settings:public';
    const cached = this.cache.get<Record<string, string>>(cacheKey);
    if (cached) return cached;

    const settings = await this.prisma.storeSetting.findMany({
      where: { isPublic: true },
    });

    const defaultSettings: Record<string, string> = {
      store_name_ar: 'كرافت',
      store_name_en: 'CRAFT',
      currency: 'EGP',
      whatsapp_number: '+201234567890',
      announcement_bar_enabled: 'false',
      announcement_text_ar: '',
      announcement_text_en: '',
      announcement_link: '/shop',
      announcement_coupon: '',
      social_links: JSON.stringify({
        instagram: 'https://instagram.com/craft.wear',
        facebook: 'https://facebook.com/craftwear',
        tiktok: 'https://tiktok.com/@craftwear',
      }),
      support_email: 'hello@craftwear.com',
      // SHEIN Concierge Settings (EGP)
      shein_enabled: 'true',
      shein_shipping_fee: '100', // EGP
      shein_service_fee: '75', // EGP
      shein_delivery_fee: '60', // EGP (local delivery in Egypt)
      shein_exchange_rate: '1', // If price is already in EGP, or multiplier
      shein_estimated_days: '10-15 يوم عمل',
    };

    const result: Record<string, string> = { ...defaultSettings };
    settings.forEach((s) => {
      if (s.value !== undefined && s.value !== null) {
        result[s.key] = s.value;
      }
    });

    const ttl = Number(process.env.PUBLIC_CACHE_TTL_SECONDS || '60') * 1000;
    this.cache.set(cacheKey, result, ttl);

    return result;
  }

  async getAllSettings() {
    return this.cache.getOrSet('settings:all', 60000, async () => {
      return this.prisma.storeSetting.findMany({
        orderBy: { key: 'asc' },
      });
    });
  }

  async updateSetting(key: string, value: string, group?: SettingGroup, userId?: string) {
    const updated = await this.prisma.storeSetting.upsert({
      where: { key },
      update: { value, isPublic: true, ...(group ? { group } : {}) },
      create: { key, value, group: group || SettingGroup.GENERAL, isPublic: true },
    });

    // Invalidate settings cache
    this.cache.deleteByPrefix('settings:');

    await this.auditService.log({
      userId,
      action: 'SETTING_UPDATE',
      entity: 'StoreSetting',
      entityId: key,
      newValues: { value, group },
    });

    return updated;
  }

  async exportBackup() {
    const [
      categories,
      colors,
      sizes,
      products,
      discounts,
      orders,
      cmsSections,
      storeSettings,
      users,
      auditLogs,
      visitorSessions,
      abandonedCarts,
    ] = await Promise.all([
      this.prisma.category.findMany(),
      this.prisma.color.findMany(),
      this.prisma.size.findMany(),
      this.prisma.product.findMany({
        include: {
          variants: true,
          images: true,
        },
      }),
      this.prisma.discount.findMany({
        include: {
          discountProducts: true,
          discountCategories: true,
        },
      }),
      this.prisma.order.findMany({
        include: {
          items: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.cMSSection.findMany(),
      this.prisma.storeSetting.findMany(),
      this.prisma.user.findMany({
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          isActive: true,
          createdAt: true,
          userRoles: {
            select: {
              role: {
                select: { name: true, displayNameAr: true, displayNameEn: true },
              },
            },
          },
        },
      }),
      this.prisma.auditLog.findMany({
        take: 2000,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.visitorSession.findMany({
        take: 2000,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.abandonedCart.findMany({
        take: 2000,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      generator: 'CRAFT Fashion Store Backup Engine',
      stats: {
        productsCount: products.length,
        categoriesCount: categories.length,
        ordersCount: orders.length,
        settingsCount: storeSettings.length,
        usersCount: users.length,
      },
      data: {
        categories,
        colors,
        sizes,
        products,
        discounts,
        orders,
        cmsSections,
        storeSettings,
        users,
        auditLogs,
        visitorSessions,
        abandonedCarts,
      },
    };
  }

  async importBackup(backupPayload: any, userId?: string) {
    if (!backupPayload || typeof backupPayload !== 'object') {
      throw new BadRequestException('Invalid backup payload: payload must be a JSON object');
    }

    const data = backupPayload.data || backupPayload;

    const stats = {
      categories: 0,
      colors: 0,
      sizes: 0,
      products: 0,
      variants: 0,
      images: 0,
      discounts: 0,
      orders: 0,
      cmsSections: 0,
      storeSettings: 0,
    };

    await this.prisma.$transaction(async (tx) => {
      // 1. Categories
      if (Array.isArray(data.categories)) {
        for (const cat of data.categories) {
          if (!cat.id || !cat.slug || !cat.nameAr) continue;
          await tx.category.upsert({
            where: { id: cat.id },
            update: {
              parentId: cat.parentId || null,
              nameAr: cat.nameAr,
              nameEn: cat.nameEn || cat.nameAr,
              slug: cat.slug,
              descriptionAr: cat.descriptionAr || null,
              descriptionEn: cat.descriptionEn || null,
              imageUrl: cat.imageUrl || null,
              displayOrder: Number(cat.displayOrder) || 0,
              isActive: cat.isActive !== false,
            },
            create: {
              id: cat.id,
              parentId: cat.parentId || null,
              nameAr: cat.nameAr,
              nameEn: cat.nameEn || cat.nameAr,
              slug: cat.slug,
              descriptionAr: cat.descriptionAr || null,
              descriptionEn: cat.descriptionEn || null,
              imageUrl: cat.imageUrl || null,
              displayOrder: Number(cat.displayOrder) || 0,
              isActive: cat.isActive !== false,
            },
          });
          stats.categories++;
        }
      }

      // 2. Colors
      if (Array.isArray(data.colors)) {
        for (const col of data.colors) {
          if (!col.id || !col.nameAr || !col.hexCode) continue;
          await tx.color.upsert({
            where: { id: col.id },
            update: {
              nameAr: col.nameAr,
              nameEn: col.nameEn || col.nameAr,
              hexCode: col.hexCode,
              displayOrder: Number(col.displayOrder) || 0,
              isActive: col.isActive !== false,
            },
            create: {
              id: col.id,
              nameAr: col.nameAr,
              nameEn: col.nameEn || col.nameAr,
              hexCode: col.hexCode,
              displayOrder: Number(col.displayOrder) || 0,
              isActive: col.isActive !== false,
            },
          });
          stats.colors++;
        }
      }

      // 3. Sizes
      if (Array.isArray(data.sizes)) {
        for (const sz of data.sizes) {
          if (!sz.id || !sz.nameAr) continue;
          await tx.size.upsert({
            where: { id: sz.id },
            update: {
              nameAr: sz.nameAr,
              nameEn: sz.nameEn || sz.nameAr,
              displayOrder: Number(sz.displayOrder) || 0,
              isActive: sz.isActive !== false,
            },
            create: {
              id: sz.id,
              nameAr: sz.nameAr,
              nameEn: sz.nameEn || sz.nameAr,
              displayOrder: Number(sz.displayOrder) || 0,
              isActive: sz.isActive !== false,
            },
          });
          stats.sizes++;
        }
      }

      // 4. Products, Variants & Images
      if (Array.isArray(data.products)) {
        for (const prod of data.products) {
          if (!prod.id || !prod.slug || !prod.nameAr || !prod.categoryId) continue;
          await tx.product.upsert({
            where: { id: prod.id },
            update: {
              categoryId: prod.categoryId,
              nameAr: prod.nameAr,
              nameEn: prod.nameEn || prod.nameAr,
              slug: prod.slug,
              descriptionAr: prod.descriptionAr || null,
              descriptionEn: prod.descriptionEn || null,
              basePrice: Number(prod.basePrice) || 0,
              isFeatured: Boolean(prod.isFeatured),
              isActive: prod.isActive !== false,
              seoTitleAr: prod.seoTitleAr || null,
              seoTitleEn: prod.seoTitleEn || null,
              seoDescAr: prod.seoDescAr || null,
              seoDescEn: prod.seoDescEn || null,
            },
            create: {
              id: prod.id,
              categoryId: prod.categoryId,
              nameAr: prod.nameAr,
              nameEn: prod.nameEn || prod.nameAr,
              slug: prod.slug,
              descriptionAr: prod.descriptionAr || null,
              descriptionEn: prod.descriptionEn || null,
              basePrice: Number(prod.basePrice) || 0,
              isFeatured: Boolean(prod.isFeatured),
              isActive: prod.isActive !== false,
              seoTitleAr: prod.seoTitleAr || null,
              seoTitleEn: prod.seoTitleEn || null,
              seoDescAr: prod.seoDescAr || null,
              seoDescEn: prod.seoDescEn || null,
            },
          });
          stats.products++;

          // Variants
          if (Array.isArray(prod.variants)) {
            for (const v of prod.variants) {
              if (!v.id || !v.sku || !v.colorId || !v.sizeId) continue;
              await tx.productVariant.upsert({
                where: { id: v.id },
                update: {
                  productId: prod.id,
                  colorId: v.colorId,
                  sizeId: v.sizeId,
                  sku: v.sku,
                  price: Number(v.price) || Number(prod.basePrice) || 0,
                  compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : null,
                  stockQuantity: Number(v.stockQuantity) || 0,
                  lowStockThreshold: Number(v.lowStockThreshold) || 5,
                  isActive: v.isActive !== false,
                },
                create: {
                  id: v.id,
                  productId: prod.id,
                  colorId: v.colorId,
                  sizeId: v.sizeId,
                  sku: v.sku,
                  price: Number(v.price) || Number(prod.basePrice) || 0,
                  compareAtPrice: v.compareAtPrice ? Number(v.compareAtPrice) : null,
                  stockQuantity: Number(v.stockQuantity) || 0,
                  lowStockThreshold: Number(v.lowStockThreshold) || 5,
                  isActive: v.isActive !== false,
                },
              });
              stats.variants++;
            }
          }

          // Images
          if (Array.isArray(prod.images)) {
            for (const img of prod.images) {
              if (!img.id || !img.url) continue;
              await tx.productImage.upsert({
                where: { id: img.id },
                update: {
                  productId: prod.id,
                  colorId: img.colorId || null,
                  url: img.url,
                  altTextAr: img.altTextAr || null,
                  altTextEn: img.altTextEn || null,
                  displayOrder: Number(img.displayOrder) || 0,
                  isPrimary: Boolean(img.isPrimary),
                },
                create: {
                  id: img.id,
                  productId: prod.id,
                  colorId: img.colorId || null,
                  url: img.url,
                  altTextAr: img.altTextAr || null,
                  altTextEn: img.altTextEn || null,
                  displayOrder: Number(img.displayOrder) || 0,
                  isPrimary: Boolean(img.isPrimary),
                },
              });
              stats.images++;
            }
          }
        }
      }

      // 5. Discounts
      if (Array.isArray(data.discounts)) {
        for (const disc of data.discounts) {
          if (!disc.id || !disc.nameAr || !disc.value) continue;
          await tx.discount.upsert({
            where: { id: disc.id },
            update: {
              nameAr: disc.nameAr,
              nameEn: disc.nameEn || disc.nameAr,
              type: (disc.type as DiscountType) || DiscountType.PERCENTAGE,
              value: Number(disc.value),
              startDate: new Date(disc.startDate || Date.now()),
              endDate: disc.endDate ? new Date(disc.endDate) : null,
              isActive: disc.isActive !== false,
              applyToAll: Boolean(disc.applyToAll),
            },
            create: {
              id: disc.id,
              nameAr: disc.nameAr,
              nameEn: disc.nameEn || disc.nameAr,
              type: (disc.type as DiscountType) || DiscountType.PERCENTAGE,
              value: Number(disc.value),
              startDate: new Date(disc.startDate || Date.now()),
              endDate: disc.endDate ? new Date(disc.endDate) : null,
              isActive: disc.isActive !== false,
              applyToAll: Boolean(disc.applyToAll),
            },
          });
          stats.discounts++;
        }
      }

      // 6. CMS Sections
      if (Array.isArray(data.cmsSections)) {
        for (const cms of data.cmsSections) {
          if (!cms.key || !cms.type) continue;
          await tx.cMSSection.upsert({
            where: { key: cms.key },
            update: {
              type: (cms.type as CMSSectionType) || CMSSectionType.PROMO_BANNER,
              titleAr: cms.titleAr || null,
              titleEn: cms.titleEn || null,
              subtitleAr: cms.subtitleAr || null,
              subtitleEn: cms.subtitleEn || null,
              payload: cms.payload || {},
              displayOrder: Number(cms.displayOrder) || 0,
              isActive: cms.isActive !== false,
            },
            create: {
              key: cms.key,
              type: (cms.type as CMSSectionType) || CMSSectionType.PROMO_BANNER,
              titleAr: cms.titleAr || null,
              titleEn: cms.titleEn || null,
              subtitleAr: cms.subtitleAr || null,
              subtitleEn: cms.subtitleEn || null,
              payload: cms.payload || {},
              displayOrder: Number(cms.displayOrder) || 0,
              isActive: cms.isActive !== false,
            },
          });
          stats.cmsSections++;
        }
      }

      // 7. Store Settings
      if (Array.isArray(data.storeSettings)) {
        for (const s of data.storeSettings) {
          if (!s.key) continue;
          await tx.storeSetting.upsert({
            where: { key: s.key },
            update: {
              value: String(s.value ?? ''),
              group: (s.group as SettingGroup) || SettingGroup.GENERAL,
              isPublic: s.isPublic !== false,
            },
            create: {
              key: s.key,
              value: String(s.value ?? ''),
              group: (s.group as SettingGroup) || SettingGroup.GENERAL,
              isPublic: s.isPublic !== false,
            },
          });
          stats.storeSettings++;
        }
      }

      // 8. Orders & Items
      if (Array.isArray(data.orders)) {
        for (const o of data.orders) {
          if (!o.id || !o.orderNumber || !o.customerName || !o.customerPhone) continue;
          await tx.order.upsert({
            where: { id: o.id },
            update: {
              orderNumber: o.orderNumber,
              customerName: o.customerName,
              customerPhone: o.customerPhone,
              customerCity: o.customerCity || null,
              customerAddress: o.customerAddress || null,
              notes: o.notes || null,
              status: (o.status as OrderStatus) || OrderStatus.PENDING,
              totalAmount: Number(o.totalAmount) || 0,
              currency: o.currency || 'EGP',
              whatsappMessage: o.whatsappMessage || null,
            },
            create: {
              id: o.id,
              orderNumber: o.orderNumber,
              customerName: o.customerName,
              customerPhone: o.customerPhone,
              customerCity: o.customerCity || null,
              customerAddress: o.customerAddress || null,
              notes: o.notes || null,
              status: (o.status as OrderStatus) || OrderStatus.PENDING,
              totalAmount: Number(o.totalAmount) || 0,
              currency: o.currency || 'EGP',
              whatsappMessage: o.whatsappMessage || null,
            },
          });
          stats.orders++;

          if (Array.isArray(o.items)) {
            for (const it of o.items) {
              if (!it.id || !it.skuSnapshot || !it.productNameAr) continue;
              await tx.orderItem.upsert({
                where: { id: it.id },
                update: {
                  orderId: o.id,
                  variantId: it.variantId || null,
                  skuSnapshot: it.skuSnapshot,
                  productNameAr: it.productNameAr,
                  productNameEn: it.productNameEn || it.productNameAr,
                  colorNameAr: it.colorNameAr || 'افتراضي',
                  colorNameEn: it.colorNameEn || 'Default',
                  sizeNameAr: it.sizeNameAr || 'افتراضي',
                  sizeNameEn: it.sizeNameEn || 'Default',
                  unitPrice: Number(it.unitPrice) || 0,
                  quantity: Number(it.quantity) || 1,
                  subtotal: Number(it.subtotal) || 0,
                },
                create: {
                  id: it.id,
                  orderId: o.id,
                  variantId: it.variantId || null,
                  skuSnapshot: it.skuSnapshot,
                  productNameAr: it.productNameAr,
                  productNameEn: it.productNameEn || it.productNameAr,
                  colorNameAr: it.colorNameAr || 'افتراضي',
                  colorNameEn: it.colorNameEn || 'Default',
                  sizeNameAr: it.sizeNameAr || 'افتراضي',
                  sizeNameEn: it.sizeNameEn || 'Default',
                  unitPrice: Number(it.unitPrice) || 0,
                  quantity: Number(it.quantity) || 1,
                  subtotal: Number(it.subtotal) || 0,
                },
              });
            }
          }
        }
      }
    });

    // Invalidate settings cache
    this.cache.deleteByPrefix('settings:');

    await this.auditService.log({
      userId,
      action: 'RESTORE_BACKUP',
      entity: 'SystemBackup',
      entityId: 'full_restore',
      newValues: { stats },
    });

    return {
      success: true,
      message: 'Backup restored successfully',
      stats,
    };
  }

  async resetBackup(userId?: string) {
    // 1. Ensure CRAFT store settings
    const defaultSettings = [
      { key: 'store_name_ar', value: 'كرافت', group: SettingGroup.BRANDING },
      { key: 'store_name_en', value: 'CRAFT', group: SettingGroup.BRANDING },
      { key: 'currency', value: 'EGP', group: SettingGroup.GENERAL },
      { key: 'whatsapp_number', value: '+201234567890', group: SettingGroup.WHATSAPP },
      {
        key: 'whatsapp_order_template_ar',
        value: 'مرحباً CRAFT! أرغب في تأكيد الطلب التالي:\nرقم الطلب: {orderNumber}\nالمنتجات:\n{items}\nالإجمالي: {total} {currency}\nالاسم: {customerName}\nالعنوان: {customerAddress}',
        group: SettingGroup.WHATSAPP,
      },
      {
        key: 'whatsapp_shein_template_ar',
        value: '🛍️ *طلب استيراد جديد من SHEIN - {storeName}*\n📋 *رقم الطلب:* #{orderNumber}\n\n👤 *اسم العميل:* {customerName}\n📱 *رقم الهاتف:* {customerPhone}\n📍 *العنوان:* {customerAddress}\n📝 *ملاحظات الشحن:* {notes}\n\n👗 *المنتجات المطلوبة من شي إن:* ({itemsCount})\n\n{itemsSummary}\n\n─────────────────\n🇸🇦 *الإجمالي بالريال السعودي:* {totalSar} ر.س\n💵 *الإجمالي المحول بالجنيه المصري:* {total} {currency}\n⏱️ *مدة التوصيل:* {estimatedDays}',
        group: SettingGroup.WHATSAPP,
      },
      {
        key: 'social_links',
        value: JSON.stringify({
          instagram: 'https://instagram.com/craft.wear',
          facebook: 'https://facebook.com/craftwear',
          tiktok: 'https://tiktok.com/@craftwear',
        }),
        group: SettingGroup.BRANDING,
      },
      { key: 'support_email', value: 'hello@craftwear.com', group: SettingGroup.GENERAL },
      { key: 'announcement_bar_enabled', value: 'true', group: SettingGroup.GENERAL },
      { key: 'announcement_text_ar', value: 'خصم 15% على جميع التيشيرتات بكود CRAFT15', group: SettingGroup.GENERAL },
      { key: 'announcement_text_en', value: '15% OFF on all T-Shirts with code CRAFT15', group: SettingGroup.GENERAL },
      { key: 'announcement_link', value: '/shop', group: SettingGroup.GENERAL },
      { key: 'announcement_coupon', value: 'CRAFT15', group: SettingGroup.GENERAL },
    ];

    for (const s of defaultSettings) {
      await this.prisma.storeSetting.upsert({
        where: { key: s.key },
        update: { value: s.value, group: s.group, isPublic: true },
        create: { key: s.key, value: s.value, group: s.group, isPublic: true },
      });
    }

    // Invalidate settings cache
    this.cache.deleteByPrefix('settings:');

    await this.auditService.log({
      userId,
      action: 'RESET_BACKUP',
      entity: 'SystemBackup',
      entityId: 'factory_reset',
    });

    return {
      success: true,
      message: 'Store settings reset to CRAFT defaults successfully',
    };
  }
}
