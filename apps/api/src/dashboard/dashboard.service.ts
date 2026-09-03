import { Injectable } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../common/cache/cache.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  async getStats() {
    return this.cache.getOrSet('dashboard:stats', 30000, async () => {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      // Consolidated parallel queries (reduced from 18 sequential roundtrips to 8 focused operations)
      const [
        orderStatusGroups,
        productStatusGroups,
        totalCategories,
        totalUsers,
        recentOrders,
        recentProducts,
        todayActiveRevenueResult,
        todayOrdersCountResult,
        lowStockVariants,
      ] = await Promise.all([
        // 1. Grouped order status counts and revenue sums (replaces 9 individual queries)
        this.prisma.order.groupBy({
          by: ['status'],
          _count: { _all: true },
          _sum: { totalAmount: true },
        }),

        // 2. Product active vs draft counts (replaces 2 queries)
        this.prisma.product.groupBy({
          by: ['isActive'],
          where: { deletedAt: null },
          _count: { _all: true },
        }),

        // 3. Category count
        this.prisma.category.count(),

        // 4. User count
        this.prisma.user.count(),

        // 5. Recent orders with minimal required projection
        this.prisma.order.findMany({
          take: 8,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            orderNumber: true,
            customerName: true,
            customerPhone: true,
            customerCity: true,
            totalAmount: true,
            currency: true,
            status: true,
            createdAt: true,
          },
        }),

        // 6. Recent products with minimal projection
        this.prisma.product.findMany({
          take: 5,
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
            slug: true,
            basePrice: true,
            isActive: true,
            createdAt: true,
            images: { take: 1, select: { url: true } },
          },
        }),

        // 7. Today revenue (excluding cancelled orders per business rules)
        this.prisma.order.aggregate({
          where: {
            createdAt: { gte: todayStart },
            status: { not: OrderStatus.CANCELLED },
          },
          _sum: { totalAmount: true },
        }),

        // 8. Today total orders count
        this.prisma.order.count({
          where: {
            createdAt: { gte: todayStart },
          },
        }),

        // 9. Low stock variants count
        this.prisma.productVariant.count({
          where: {
            isActive: true,
            stockQuantity: { lte: 5 },
            product: { deletedAt: null, isActive: true },
          },
        }),
      ]);

      // Map grouped order counts and sums back to exact response contract
      const orderCountsByStatus: Record<string, number> = {};
      const orderSumsByStatus: Record<string, number> = {};
      let totalOrders = 0;

      for (const group of orderStatusGroups) {
        const count = group._count._all || 0;
        const sum = Number(group._sum.totalAmount || 0);
        orderCountsByStatus[group.status] = count;
        orderSumsByStatus[group.status] = sum;
        totalOrders += count;
      }

      const pendingOrders = orderCountsByStatus[OrderStatus.PENDING] || 0;
      const contactedOrders = orderCountsByStatus[OrderStatus.CONTACTED] || 0;
      const confirmedOrders = orderCountsByStatus[OrderStatus.CONFIRMED] || 0;
      const processingOrders = orderCountsByStatus[OrderStatus.PROCESSING] || 0;
      const completedOrders = orderCountsByStatus[OrderStatus.COMPLETED] || 0;
      const cancelledOrders = orderCountsByStatus[OrderStatus.CANCELLED] || 0;

      // Active revenue = COMPLETED + PROCESSING + CONFIRMED (matches exact original business logic)
      const totalActiveRevenue =
        (orderSumsByStatus[OrderStatus.COMPLETED] || 0) +
        (orderSumsByStatus[OrderStatus.PROCESSING] || 0) +
        (orderSumsByStatus[OrderStatus.CONFIRMED] || 0);

      const completedRevenue = orderSumsByStatus[OrderStatus.COMPLETED] || 0;
      const todayRevenue = Number(todayActiveRevenueResult._sum.totalAmount || 0);

      // Map product counts
      let totalProducts = 0;
      let activeProducts = 0;
      for (const pGroup of productStatusGroups) {
        const pCount = pGroup._count._all || 0;
        totalProducts += pCount;
        if (pGroup.isActive) {
          activeProducts = pCount;
        }
      }

      const validOrdersCount = totalOrders - cancelledOrders;
      const averageOrderValue = validOrdersCount > 0 ? Math.round(totalActiveRevenue / validOrdersCount) : 0;

      return {
        totalProducts,
        activeProducts,
        lowStockCount: lowStockVariants,
        totalOrders,
        pendingOrders,
        contactedOrders,
        confirmedOrders,
        processingOrders,
        completedOrders,
        cancelledOrders,
        totalCategories,
        totalUsers,
        totalRevenue: totalActiveRevenue,
        completedRevenue,
        todayRevenue,
        todayOrdersCount: todayOrdersCountResult,
        averageOrderValue,
        currency: 'EGP',
        recentOrders,
        recentProducts,
      };
    });
  }
}
