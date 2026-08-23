import { Injectable } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const [
      totalProducts,
      activeProducts,
      totalOrders,
      pendingOrders,
      completedOrders,
      totalCategories,
      totalUsers,
      recentOrders,
      recentProducts,
      revenueResult,
      lowStockVariants,
    ] = await Promise.all([
      this.prisma.product.count({ where: { deletedAt: null } }),
      this.prisma.product.count({ where: { deletedAt: null, isActive: true } }),
      this.prisma.order.count(),
      this.prisma.order.count({ where: { status: OrderStatus.PENDING } }),
      this.prisma.order.count({ where: { status: OrderStatus.COMPLETED } }),
      this.prisma.category.count(),
      this.prisma.user.count(),
      this.prisma.order.findMany({
        take: 6,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          orderNumber: true,
          customerName: true,
          customerPhone: true,
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
      this.prisma.productVariant.count({
        where: {
          isActive: true,
          stockQuantity: { lte: 5 },
          product: { deletedAt: null, isActive: true },
        },
      }),
    ]);

    return {
      totalProducts,
      activeProducts,
      lowStockCount: lowStockVariants,
      totalOrders,
      pendingOrders,
      completedOrders,
      totalCategories,
      totalUsers,
      totalRevenue: revenueResult._sum.totalAmount || 0,
      currency: 'EGP',
      recentOrders,
      recentProducts,
    };
  }
}
