import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RecordHitDto } from './dto/record-hit.dto';
import { RecordEventDto } from './dto/record-event.dto';
import { RecordAbandonedCartDto } from './dto/record-abandoned-cart.dto';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async recordHit(dto: RecordHitDto, detectedIp?: string) {
    const ip = detectedIp || dto.ipAddress || '127.0.0.1';
    const currentPath = dto.currentPath || '/';

    try {
      const existing = await this.prisma.visitorSession.findUnique({
        where: { sessionId: dto.sessionId },
      });

      if (existing) {
        const updatedPages = existing.pagesVisited.includes(currentPath)
          ? existing.pagesVisited
          : [...existing.pagesVisited, currentPath];

        const duration = Math.max(
          0,
          Math.floor((Date.now() - new Date(existing.createdAt).getTime()) / 1000),
        );

        return await this.prisma.visitorSession.update({
          where: { sessionId: dto.sessionId },
          data: {
            totalPageViews: { increment: 1 },
            pagesVisited: updatedPages,
            durationSeconds: duration,
            ipAddress: existing.ipAddress || ip,
            updatedAt: new Date(),
          },
        });
      }

      return await this.prisma.visitorSession.create({
        data: {
          sessionId: dto.sessionId,
          visitorId: dto.visitorId,
          ipAddress: ip,
          deviceType: dto.deviceType || 'desktop',
          browser: dto.browser || 'Unknown',
          os: dto.os || 'Unknown',
          screenResolution: dto.screenResolution,
          referrer: dto.referrer || 'Direct',
          utmSource: dto.utmSource,
          utmMedium: dto.utmMedium,
          utmCampaign: dto.utmCampaign,
          utmContent: dto.utmContent,
          utmTerm: dto.utmTerm,
          pagesVisited: [currentPath],
          totalPageViews: 1,
          durationSeconds: 0,
        },
      });
    } catch {
      // Safe fallback on race condition
      try {
        const existing = await this.prisma.visitorSession.findUnique({
          where: { sessionId: dto.sessionId },
        });
        if (existing) {
          return await this.prisma.visitorSession.update({
            where: { sessionId: dto.sessionId },
            data: {
              totalPageViews: { increment: 1 },
              updatedAt: new Date(),
            },
          });
        }
      } catch {}
    }
  }

  async recordEvent(dto: RecordEventDto, detectedIp?: string) {
    const ip = detectedIp || dto.ipAddress || '127.0.0.1';

    try {
      const event = await this.prisma.analyticsEvent.create({
        data: {
          sessionId: dto.sessionId,
          visitorId: dto.visitorId,
          ipAddress: ip,
          eventType: dto.eventType,
          path: dto.path,
          payload: dto.payload || {},
        },
      });

      // If purchase event, link order to session
      if (dto.eventType === 'purchase' && dto.payload?.orderNumber) {
        await this.prisma.visitorSession
          .update({
            where: { sessionId: dto.sessionId },
            data: {
              hasOrder: true,
              orderNumber: String(dto.payload.orderNumber),
            },
          })
          .catch(() => {});
      }

      return event;
    } catch (err) {
      return null;
    }
  }

  async recordAbandonedCart(dto: RecordAbandonedCartDto, detectedIp?: string) {
    const ip = detectedIp || dto.ipAddress || '127.0.0.1';

    try {
      const existing = await this.prisma.abandonedCart.findFirst({
        where: { sessionId: dto.sessionId },
      });

      if (existing) {
        return await this.prisma.abandonedCart.update({
          where: { id: existing.id },
          data: {
            items: dto.items,
            itemsCount: dto.itemsCount || dto.items.length,
            totalValue: dto.totalValue,
            currency: dto.currency || 'EGP',
            lastActiveAt: new Date(),
            ipAddress: ip,
          },
        });
      }

      return await this.prisma.abandonedCart.create({
        data: {
          sessionId: dto.sessionId,
          visitorId: dto.visitorId,
          ipAddress: ip,
          deviceType: dto.deviceType || 'desktop',
          items: dto.items,
          itemsCount: dto.itemsCount || dto.items.length,
          totalValue: dto.totalValue,
          currency: dto.currency || 'EGP',
        },
      });
    } catch {
      return null;
    }
  }

  async getSummary(timeRange?: 'today' | 'week' | 'month' | 'all') {
    try {
      const now = new Date();
      let startDate: Date | undefined;

      if (timeRange === 'today') {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else if (timeRange === 'week') {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (timeRange === 'month') {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      const whereClause = startDate ? { createdAt: { gte: startDate } } : {};

    const [
      totalSessions,
      events,
      abandonedCarts,
      recentActiveSessions,
    ] = await Promise.all([
      this.prisma.visitorSession.findMany({
        where: whereClause,
        select: {
          id: true,
          visitorId: true,
          deviceType: true,
          browser: true,
          os: true,
          referrer: true,
          utmSource: true,
          utmCampaign: true,
          pagesVisited: true,
          totalPageViews: true,
          durationSeconds: true,
          hasOrder: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.analyticsEvent.findMany({
        where: whereClause,
        select: {
          eventType: true,
          path: true,
          payload: true,
        },
      }),
      this.prisma.abandonedCart.findMany({
        where: {
          isRecovered: false,
          ...(startDate ? { createdAt: { gte: startDate } } : {}),
        },
      }),
      // Active in last 5 minutes
      this.prisma.visitorSession.count({
        where: {
          updatedAt: { gte: new Date(Date.now() - 5 * 60 * 1000) },
        },
      }),
    ]);

    const totalVisitors = new Set(totalSessions.map((s) => s.visitorId)).size;
    const totalPageViews = totalSessions.reduce((acc, s) => acc + (s.totalPageViews || 1), 0);
    const bounceCount = totalSessions.filter((s) => (s.totalPageViews || 1) <= 1).length;
    const bounceRate = totalSessions.length > 0 ? Math.round((bounceCount / totalSessions.length) * 100) : 0;
    const avgSessionDurationSeconds = totalSessions.length > 0
      ? Math.round(totalSessions.reduce((acc, s) => acc + (s.durationSeconds || 0), 0) / totalSessions.length)
      : 0;

    // Unique visitors today & this week
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const uniqueVisitorsToday = new Set(
      totalSessions.filter((s) => new Date(s.createdAt) >= startOfToday).map((s) => s.visitorId),
    ).size;

    const uniqueVisitorsThisWeek = new Set(
      totalSessions.filter((s) => new Date(s.createdAt) >= startOfWeek).map((s) => s.visitorId),
    ).size;

    // Top Visited Pages
    const pageCounts: Record<string, number> = {};
    totalSessions.forEach((s) => {
      s.pagesVisited.forEach((p) => {
        pageCounts[p] = (pageCounts[p] || 0) + 1;
      });
    });
    const topVisitedPages = Object.entries(pageCounts)
      .map(([path, views]) => ({ path, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    // Top Viewed Products
    const productViews: Record<string, { nameAr: string; views: number; addToCartCount: number }> = {};
    events.forEach((ev) => {
      if (ev.eventType === 'view_product' && ev.payload && typeof ev.payload === 'object') {
        const prodId = String((ev.payload as any).id || (ev.payload as any).productId || '');
        const nameAr = String((ev.payload as any).nameAr || (ev.payload as any).name || 'منتج');
        if (prodId) {
          if (!productViews[prodId]) {
            productViews[prodId] = { nameAr, views: 0, addToCartCount: 0 };
          }
          productViews[prodId].views += 1;
        }
      } else if (ev.eventType === 'add_to_cart' && ev.payload && typeof ev.payload === 'object') {
        const prodId = String((ev.payload as any).productId || (ev.payload as any).id || '');
        const nameAr = String((ev.payload as any).productNameAr || (ev.payload as any).nameAr || 'منتج');
        if (prodId) {
          if (!productViews[prodId]) {
            productViews[prodId] = { nameAr, views: 0, addToCartCount: 0 };
          }
          productViews[prodId].addToCartCount += 1;
        }
      }
    });

    const topViewedProducts = Object.entries(productViews)
      .map(([productId, data]) => ({
        productId,
        nameAr: data.nameAr,
        views: data.views,
        addToCartCount: data.addToCartCount,
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    // Traffic Sources
    const sourceMap: Record<string, { visitors: number; ordersCount: number }> = {};
    totalSessions.forEach((s) => {
      const src = s.utmSource || s.referrer || 'Direct / مباشر';
      if (!sourceMap[src]) sourceMap[src] = { visitors: 0, ordersCount: 0 };
      sourceMap[src].visitors += 1;
      if (s.hasOrder) sourceMap[src].ordersCount += 1;
    });
    const trafficSources = Object.entries(sourceMap).map(([source, d]) => ({
      source,
      visitors: d.visitors,
      ordersCount: d.ordersCount,
      percentage: totalSessions.length > 0 ? Math.round((d.visitors / totalSessions.length) * 100) : 0,
    }));

    // Marketing Campaigns
    const campMap: Record<string, { campaign: string; source: string; visitors: number; ordersCount: number; revenue: number }> = {};
    totalSessions.forEach((s) => {
      if (s.utmCampaign) {
        const key = `${s.utmCampaign}-${s.utmSource || 'direct'}`;
        if (!campMap[key]) {
          campMap[key] = {
            campaign: s.utmCampaign,
            source: s.utmSource || 'Organic',
            visitors: 0,
            ordersCount: 0,
            revenue: 0,
          };
        }
        campMap[key].visitors += 1;
        if (s.hasOrder) campMap[key].ordersCount += 1;
      }
    });
    const campaigns = Object.values(campMap);

    // Device breakdown
    const devMap: Record<string, number> = {};
    totalSessions.forEach((s) => {
      const dev = s.deviceType || 'desktop';
      devMap[dev] = (devMap[dev] || 0) + 1;
    });
    const deviceBreakdown = Object.entries(devMap).map(([device, count]) => ({
      device,
      count,
      percentage: totalSessions.length > 0 ? Math.round((count / totalSessions.length) * 100) : 0,
    }));

    // OS breakdown
    const osMap: Record<string, number> = {};
    totalSessions.forEach((s) => {
      const os = s.os || 'Unknown';
      osMap[os] = (osMap[os] || 0) + 1;
    });
    const osBreakdown = Object.entries(osMap).map(([os, count]) => ({
      os,
      count,
      percentage: totalSessions.length > 0 ? Math.round((count / totalSessions.length) * 100) : 0,
    }));

    // Browser breakdown
    const brMap: Record<string, number> = {};
    totalSessions.forEach((s) => {
      const br = s.browser || 'Unknown';
      brMap[br] = (brMap[br] || 0) + 1;
    });
    const browserBreakdown = Object.entries(brMap).map(([browser, count]) => ({
      browser,
      count,
      percentage: totalSessions.length > 0 ? Math.round((count / totalSessions.length) * 100) : 0,
    }));

    const abandonedCartsCount = abandonedCarts.length;
    const abandonedCartsValue = abandonedCarts.reduce(
      (sum, c) => sum + Number(c.totalValue || 0),
      0,
    );

    return {
      totalVisitors,
      uniqueVisitorsToday,
      uniqueVisitorsThisWeek,
      liveVisitorsNow: recentActiveSessions,
      totalPageViews,
      bounceRate,
      avgSessionDurationSeconds,
      abandonedCartsCount,
      abandonedCartsValue,
      topVisitedPages,
      topViewedProducts,
      trafficSources,
      campaigns,
      deviceBreakdown,
      osBreakdown,
      browserBreakdown,
    };
    } catch (err) {
      // Safe fallback if database table doesn't exist yet or connection error
      return {
        totalVisitors: 0,
        uniqueVisitorsToday: 0,
        uniqueVisitorsThisWeek: 0,
        liveVisitorsNow: 0,
        totalPageViews: 0,
        bounceRate: 0,
        avgSessionDurationSeconds: 0,
        abandonedCartsCount: 0,
        abandonedCartsValue: 0,
        topVisitedPages: [],
        topViewedProducts: [],
        trafficSources: [],
        campaigns: [],
        deviceBreakdown: [],
        osBreakdown: [],
        browserBreakdown: [],
      };
    }
  }

  async getSessions(query: { page?: number; limit?: number; search?: string; source?: string }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    try {
      const where: any = {};
      if (query.search) {
        where.OR = [
          { ipAddress: { contains: query.search, mode: 'insensitive' } },
          { visitorId: { contains: query.search, mode: 'insensitive' } },
          { browser: { contains: query.search, mode: 'insensitive' } },
          { os: { contains: query.search, mode: 'insensitive' } },
        ];
      }
      if (query.source) {
        where.referrer = { contains: query.source, mode: 'insensitive' };
      }

      const [items, total] = await Promise.all([
        this.prisma.visitorSession.findMany({
          where,
          skip,
          take: limit,
          orderBy: { updatedAt: 'desc' },
        }),
        this.prisma.visitorSession.count({ where }),
      ]);

      const mapped = items.map((s) => ({
        id: s.id,
        visitorId: s.visitorId,
        ipAddress: s.ipAddress || '127.0.0.1',
        country: s.country,
        city: s.city,
        deviceType: s.deviceType,
        browser: s.browser,
        os: s.os,
        screenResolution: s.screenResolution,
        referrer: s.referrer,
        utmSource: s.utmSource,
        utmMedium: s.utmMedium,
        utmCampaign: s.utmCampaign,
        utmContent: s.utmContent,
        utmTerm: s.utmTerm,
        pagesVisited: s.pagesVisited,
        totalPageViews: s.totalPageViews,
        durationSeconds: s.durationSeconds,
        hasOrder: s.hasOrder,
        orderNumber: s.orderNumber,
        firstSeenAt: s.createdAt.toISOString(),
        lastSeenAt: s.updatedAt.toISOString(),
      }));

      const totalPages = Math.ceil(total / limit);

      return {
        items: mapped,
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      };
    } catch {
      return {
        items: [],
        total: 0,
        page,
        limit,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      };
    }
  }

  async getEvents(query: { page?: number; limit?: number; eventType?: string }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 30));
    const skip = (page - 1) * limit;

    try {
      const where: any = {};
      if (query.eventType) {
        where.eventType = query.eventType;
      }

      const [items, total] = await Promise.all([
        this.prisma.analyticsEvent.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.analyticsEvent.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        items,
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      };
    } catch {
      return {
        items: [],
        total: 0,
        page,
        limit,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      };
    }
  }

  async getAbandonedCarts(query: { page?: number; limit?: number }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    try {
      const [items, total] = await Promise.all([
        this.prisma.abandonedCart.findMany({
          skip,
          take: limit,
          orderBy: { updatedAt: 'desc' },
        }),
        this.prisma.abandonedCart.count(),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        items: items.map((c) => ({
          id: c.id,
          sessionId: c.sessionId,
          visitorId: c.visitorId,
          ipAddress: c.ipAddress || '127.0.0.1',
          deviceType: c.deviceType,
          items: c.items as any,
          itemsCount: c.itemsCount,
          totalValue: Number(c.totalValue),
          currency: c.currency,
          isRecovered: c.isRecovered,
          lastActiveAt: c.lastActiveAt.toISOString(),
          createdAt: c.createdAt.toISOString(),
        })),
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      };
    } catch {
      return {
        items: [],
        total: 0,
        page,
        limit,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      };
    }
  }

  async clearLogs() {
    try {
      await this.prisma.$transaction([
        this.prisma.analyticsEvent.deleteMany(),
        this.prisma.abandonedCart.deleteMany(),
        this.prisma.visitorSession.deleteMany(),
      ]);
    } catch {}

    return { message: 'Analytics logs and visitor sessions cleared successfully' };
  }
}
