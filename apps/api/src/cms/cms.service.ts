import { Injectable } from '@nestjs/common';
import { Prisma, CMSSectionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class CmsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  private getDefaultSectionType(key: string): CMSSectionType {
    if (key.includes('hero')) return CMSSectionType.HERO_SLIDER;
    if (key.includes('promo')) return CMSSectionType.PROMO_BANNER;
    if (key.includes('new_arrivals') || key.includes('featured')) return CMSSectionType.FEATURED_GRID;
    if (key.includes('categories')) return CMSSectionType.CATEGORY_CAROUSEL;
    return CMSSectionType.CUSTOM_HTML;
  }

  private async ensureStandardSections() {
    try {
      const existing = await this.prisma.cMSSection.findMany({
        select: { key: true },
      });
      const existingKeys = new Set(existing.map((s) => s.key));

      const standardSections = [
        {
          key: 'hero_banner',
          type: CMSSectionType.HERO_SLIDER,
          titleAr: 'بسيط، لكن مختلف.',
          titleEn: 'Simple, Yet Different.',
          subtitleAr: 'تصاميم راقية بجودة عالية لإطلالة تدوم طويلاً.',
          subtitleEn: 'Refined designs with superior fabric quality for a lasting look.',
          payload: {
            badgeAr: 'NEW DROP',
            badgeEn: 'NEW DROP',
            buttonTextAr: 'تسوق الآن',
            buttonTextEn: 'Shop Now',
            buttonUrl: '/shop',
            imageUrl: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=1200&q=90',
            layoutStyle: 'split',
          },
          displayOrder: 0,
          isActive: true,
        },
        {
          key: 'marquee_ticker',
          type: CMSSectionType.CUSTOM_HTML,
          titleAr: 'الشريط الإعلاني المتحرك',
          titleEn: 'Marquee Ticker',
          payload: {
            textAr: 'خامات قطنية فاخرة 100% • شحن سريع لجميع المحافظات • دفع عند الاستلام • إرجاع مجاني خلال 14 يوم • خياطة متقونة وتصاميم حصرية',
          },
          displayOrder: 1,
          isActive: true,
        },
        {
          key: 'trust_bar',
          type: CMSSectionType.CUSTOM_HTML,
          titleAr: 'مميزات المتجر والضمانات',
          titleEn: 'Store Guarantees',
          payload: {},
          displayOrder: 2,
          isActive: true,
        },
        {
          key: 'new_arrivals',
          type: CMSSectionType.FEATURED_GRID,
          titleAr: 'جديدنا',
          titleEn: 'New Arrivals',
          subtitleAr: 'أحدث التشكيلات',
          subtitleEn: 'EXPLORE OUR LATEST',
          payload: {
            limit: 12,
            sourceMode: 'latest', // 'latest' | 'featured'
          },
          displayOrder: 3,
          isActive: true,
        },
        {
          key: 'promo_banner',
          type: CMSSectionType.PROMO_BANNER,
          titleAr: 'مجموعة الموسم متوفرة الآن',
          titleEn: 'Season Collection Available Now',
          subtitleAr: 'قطع أساسية بتصاميم عصرية تناسب كل يوم وكل مكان.',
          subtitleEn: 'Essential pieces with modern silhouettes tailored for everyday comfort.',
          payload: {
            badgeAr: 'عرض خاص',
            ctaTextAr: 'تسوق العرض الآن',
            ctaLink: '/shop',
          },
          displayOrder: 4,
          isActive: true,
        },
        {
          key: 'about_section',
          type: CMSSectionType.CUSTOM_HTML,
          titleAr: 'قصتنا وهويتنا',
          titleEn: 'Our Story & Craft',
          subtitleAr: 'أزياء مصرية بجودة عالمية وتفاصيل متقنة',
          subtitleEn: 'Crafted with premium quality and passion',
          payload: {},
          displayOrder: 5,
          isActive: true,
        },
      ];

      for (const sec of standardSections) {
        if (!existingKeys.has(sec.key)) {
          await this.prisma.cMSSection.create({
            data: sec,
          });
        }
      }
    } catch {
      // ignore on readonly/migration races
    }
  }

  async getActiveSections() {
    await this.ensureStandardSections();
    return this.prisma.cMSSection.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async getAllSections() {
    await this.ensureStandardSections();
    return this.prisma.cMSSection.findMany({
      orderBy: { displayOrder: 'asc' },
    });
  }

  async upsertSection(
    key: string,
    data: {
      type?: CMSSectionType;
      titleAr?: string;
      titleEn?: string;
      subtitleAr?: string;
      subtitleEn?: string;
      payload?: Record<string, unknown>;
      displayOrder?: number;
      isActive?: boolean;
    },
    userId?: string,
  ) {
    const defaultType = this.getDefaultSectionType(key);
    const updated = await this.prisma.cMSSection.upsert({
      where: { key },
      update: {
        titleAr: data.titleAr,
        titleEn: data.titleEn,
        subtitleAr: data.subtitleAr,
        subtitleEn: data.subtitleEn,
        payload: data.payload ? (data.payload as unknown as Prisma.InputJsonValue) : undefined,
        displayOrder: data.displayOrder,
        isActive: data.isActive,
      },
      create: {
        key,
        type: data.type || defaultType,
        titleAr: data.titleAr || null,
        titleEn: data.titleEn || null,
        subtitleAr: data.subtitleAr || null,
        subtitleEn: data.subtitleEn || null,
        payload: (data.payload as unknown as Prisma.InputJsonValue) || {},
        displayOrder: data.displayOrder || 0,
        isActive: data.isActive ?? true,
      },
    });

    await this.auditService.log({
      userId,
      action: 'CMS_UPDATE',
      entity: 'CMSSection',
      entityId: key,
      newValues: { ...data },
    });

    return updated;
  }
}

