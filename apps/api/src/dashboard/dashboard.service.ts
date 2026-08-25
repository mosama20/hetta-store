import { Injectable } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      totalProducts,
      activeProducts,
      totalOrders,
      pendingOrders,
      contactedOrders,
      confirmedOrders,
      processingOrders,
      completedOrders,
      cancelledOrders,
      totalCategories,
      totalUsers,
      recentOrders,
      recentProducts,
      activeRevenueResult,
      completedRevenueResult,
      todayRevenueResult,
      todayOrdersCount,
      lowStockVariants,
    ] = await Promise.all([
      this.prisma.product.count({ where: { deletedAt: null } }),
      this.prisma.product.count({ where: { deletedAt: null, isActive: true } }),
      this.prisma.order.count(),
      this.prisma.order.count({ where: { status: OrderStatus.PENDING } }),
      this.prisma.order.count({ where: { status: OrderStatus.CONTACTED } }),
      this.prisma.order.count({ where: { status: OrderStatus.CONFIRMED } }),
      this.prisma.order.count({ where: { status: OrderStatus.PROCESSING } }),
      this.prisma.order.count({ where: { status: OrderStatus.COMPLETED } }),
      this.prisma.order.count({ where: { status: OrderStatus.CANCELLED } }),
      this.prisma.category.count(),
      this.prisma.user.count(),
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
      this.prisma.order.aggregate({
        where: {
          status: { in: [OrderStatus.COMPLETED, OrderStatus.PROCESSING, OrderStatus.CONFIRMED] },
        },
        _sum: { totalAmount: true },
      }),
      this.prisma.order.aggregate({
        where: {
          status: OrderStatus.COMPLETED,
        },
        _sum: { totalAmount: true },
      }),
      this.prisma.order.aggregate({
        where: {
          createdAt: { gte: todayStart },
          status: { not: OrderStatus.CANCELLED },
        },
        _sum: { totalAmount: true },
      }),
      this.prisma.order.count({
        where: {
          createdAt: { gte: todayStart },
        },
      }),
      this.prisma.productVariant.count({
        where: {
          isActive: true,
          stockQuantity: { lte: 5 },
          product: { deletedAt: null, isActive: true },
        },
      }),
    ]);

    const totalActiveRevenue = Number(activeRevenueResult._sum.totalAmount || 0);
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
      completedRevenue: Number(completedRevenueResult._sum.totalAmount || 0),
      todayRevenue: Number(todayRevenueResult._sum.totalAmount || 0),
      todayOrdersCount,
      averageOrderValue,
      currency: 'EGP',
      recentOrders,
      recentProducts,
    };
  }
}
