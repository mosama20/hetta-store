import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../common/cache/cache.service';
import { RecordHitDto } from './dto/record-hit.dto';
import { RecordEventDto } from './dto/record-event.dto';
import { RecordAbandonedCartDto } from './dto/record-abandoned-cart.dto';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

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
    return this.cache.getOrSet(`analytics:summary:${timeRange || 'all'}`, 45000, async () => {
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
          sessionAgg,
          abandonedCartAgg,
          recentActiveSessions,
          deviceGroups,
          osGroups,
          browserGroups,
          sampleSessions,
          sampleEvents,
        ] = await Promise.all([
          // 1. Database-side mathematical aggregation over entire dataset
          this.prisma.visitorSession.aggregate({
            where: whereClause,
            _sum: { totalPageViews: true },
            _avg: { durationSeconds: true },
            _count: { _all: true },
          }),
          // 2. Database-side aggregation for abandoned carts over entire dataset
          this.prisma.abandonedCart.aggregate({
            where: {
              isRecovered: false,
              ...(startDate ? { createdAt: { gte: startDate } } : {}),
            },
            _count: { _all: true },
            _sum: { totalValue: true },
          }),
          // 3. Active in last 5 minutes
          this.prisma.visitorSession.count({
            where: {
              updatedAt: { gte: new Date(Date.now() - 5 * 60 * 1000) },
            },
          }),
          // 4. Database-side device breakdown across entire table
          this.prisma.visitorSession.groupBy({
            by: ['deviceType'],
            where: whereClause,
            _count: { _all: true },
          }),
          // 5. Database-side OS breakdown across entire table
          this.prisma.visitorSession.groupBy({
            by: ['os'],
            where: whereClause,
            _count: { _all: true },
          }),
          // 6. Database-side Browser breakdown across entire table
          this.prisma.visitorSession.groupBy({
            by: ['browser'],
            where: whereClause,
            _count: { _all: true },
          }),
          // 7. Recent sessions sample for path and campaign extraction (bounded projection)
          this.prisma.visitorSession.findMany({
            where: whereClause,
            take: 200,
            select: {
              visitorId: true,
              referrer: true,
              utmSource: true,
              utmCampaign: true,
              pagesVisited: true,
              totalPageViews: true,
              hasOrder: true,
              createdAt: true,
            },
            orderBy: { updatedAt: 'desc' },
          }),
          // 8. Recent events sample for top viewed products (bounded projection)
          this.prisma.analyticsEvent.findMany({
            where: {
              ...whereClause,
              eventType: { in: ['view_product', 'add_to_cart'] },
            },
            take: 200,
            orderBy: { createdAt: 'desc' },
            select: {
              eventType: true,
              path: true,
              payload: true,
            },
          }),
        ]);

        const totalDbSessions = sessionAgg._count._all;
        const totalPageViews = sessionAgg._sum.totalPageViews || 0;
        const avgSessionDurationSeconds = Math.round(sessionAgg._avg.durationSeconds || 0);

        const abandonedCartsCount = abandonedCartAgg._count._all;
        const abandonedCartsValue = Number(abandonedCartAgg._sum.totalValue || 0);

        // Unique visitors and bounce rate from sample/aggregations
        const totalVisitors = new Set(sampleSessions.map((s) => s.visitorId)).size;
        const bounceCount = sampleSessions.filter((s) => (s.totalPageViews || 1) <= 1).length;
        const bounceRate = sampleSessions.length > 0 ? Math.round((bounceCount / sampleSessions.length) * 100) : 0;

        // Unique visitors today & this week
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const uniqueVisitorsToday = new Set(
          sampleSessions.filter((s) => new Date(s.createdAt) >= startOfToday).map((s) => s.visitorId),
        ).size;

        const uniqueVisitorsThisWeek = new Set(
          sampleSessions.filter((s) => new Date(s.createdAt) >= startOfWeek).map((s) => s.visitorId),
        ).size;

    // Top Visited Pages
    const pageCounts: Record<string, number> = {};
    sampleSessions.forEach((s) => {
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
    sampleEvents.forEach((ev) => {
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
    sampleSessions.forEach((s) => {
      const src = s.utmSource || s.referrer || 'Direct / مباشر';
      if (!sourceMap[src]) sourceMap[src] = { visitors: 0, ordersCount: 0 };
      sourceMap[src].visitors += 1;
      if (s.hasOrder) sourceMap[src].ordersCount += 1;
    });
    const trafficSources = Object.entries(sourceMap).map(([source, d]) => ({
      source,
      visitors: d.visitors,
      ordersCount: d.ordersCount,
      percentage: sampleSessions.length > 0 ? Math.round((d.visitors / sampleSessions.length) * 100) : 0,
    }));

    // Marketing Campaigns
    const campMap: Record<string, { campaign: string; source: string; visitors: number; ordersCount: number; revenue: number }> = {};
    sampleSessions.forEach((s) => {
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

    // Device breakdown (from database-wide groupBy across entire table)
    const deviceBreakdown = deviceGroups.map((g) => ({
      device: g.deviceType || 'desktop',
      count: g._count._all,
      percentage: totalDbSessions > 0 ? Math.round((g._count._all / totalDbSessions) * 100) : 0,
    }));

    // OS breakdown (from database-wide groupBy across entire table)
    const osBreakdown = osGroups.map((g) => ({
      os: g.os || 'Unknown',
      count: g._count._all,
      percentage: totalDbSessions > 0 ? Math.round((g._count._all / totalDbSessions) * 100) : 0,
    }));

    // Browser breakdown (from database-wide groupBy across entire table)
    const browserBreakdown = browserGroups.map((g) => ({
      browser: g.browser || 'Unknown',
      count: g._count._all,
      percentage: totalDbSessions > 0 ? Math.round((g._count._all / totalDbSessions) * 100) : 0,
    }));

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
      } catch (err: any) {
        console.error('[AnalyticsService] getSummary error:', err?.message || err);
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
    });
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
    } catch (err: any) {
      console.error('[AnalyticsService] getSessions error:', err?.message || err);
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
    } catch (err: any) {
      console.error('[AnalyticsService] getEvents error:', err?.message || err);
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
    } catch (err: any) {
      console.error('[AnalyticsService] getAbandonedCarts error:', err?.message || err);
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
      this.cache.deleteByPrefix('analytics:');
    } catch {}

    return { message: 'Analytics logs and visitor sessions cleared successfully' };
  }
}
