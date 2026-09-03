import { Injectable } from '@nestjs/common';
import { Prisma, CMSSectionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CacheService } from '../common/cache/cache.service';

@Injectable()
export class CmsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly cache: CacheService,
  ) {}

  private getDefaultSectionType(key: string): CMSSectionType {
    if (key.includes('hero')) return CMSSectionType.HERO_SLIDER;
    if (key.includes('promo')) return CMSSectionType.PROMO_BANNER;
    if (key.includes('new_arrivals') || key.includes('featured')) return CMSSectionType.FEATURED_GRID;
    if (key.includes('categories')) return CMSSectionType.CATEGORY_CAROUSEL;
    return CMSSectionType.CUSTOM_HTML;
  }

  async getActiveSections() {
    const cacheKey = 'cms:active';
    const cached = this.cache.get<unknown[]>(cacheKey);
    if (cached) return cached;

    const sections = await this.prisma.cMSSection.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
    });

    const ttl = Number(process.env.PUBLIC_CACHE_TTL_SECONDS || '60') * 1000;
    this.cache.set(cacheKey, sections, ttl);

    return sections;
  }

  async getAllSections() {
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

    // Invalidate CMS cache after mutation
    this.cache.deleteByPrefix('cms:');

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
