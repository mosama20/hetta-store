import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { AuditService } from '../audit/audit.service';
import { CacheService } from '../common/cache/cache.service';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly cache: CacheService,
  ) { }

  private generateOrderNumber(): string {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(1000 + Math.random() * 9000);
    return `ORD-${timestamp}-${random}`;
  }

  async create(dto: CreateOrderDto) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Order must contain at least one item');
    }

    // 1. Fetch variants and their master products
    const variantIds = dto.items.map((i) => i.variantId);
    const variants = await this.prisma.productVariant.findMany({
      where: {
        id: { in: variantIds },
        isActive: true,
        product: { isActive: true, deletedAt: null },
      },
      include: {
        product: true,
        color: true,
        size: true,
      },
    });

    const variantMap = new Map(variants.map((v) => [v.id, v]));

    // Validate stock and prepare snapshot items
    const orderItemsData: {
      variantId: string;
      skuSnapshot: string;
      productNameAr: string;
      productNameEn: string;
      colorNameAr: string;
      colorNameEn: string;
      sizeNameAr: string;
      sizeNameEn: string;
      unitPrice: number;
      quantity: number;
      subtotal: number;
    }[] = [];

    let totalAmount = 0;

    for (const item of dto.items) {
      const variant = variantMap.get(item.variantId);
      if (!variant) {
        throw new BadRequestException(
          `Variant with ID ${item.variantId} is not available or inactive`,
        );
      }

      if (variant.stockQuantity < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for '${variant.product.nameEn} (${variant.sku})'. Available: ${variant.stockQuantity}`,
        );
      }

      const unitPrice = Number(variant.price);
      const subtotal = unitPrice * item.quantity;
      totalAmount += subtotal;

      orderItemsData.push({
        variantId: variant.id,
        skuSnapshot: variant.sku,
        productNameAr: variant.product.nameAr,
        productNameEn: variant.product.nameEn,
        colorNameAr: variant.color.nameAr,
        colorNameEn: variant.color.nameEn,
        sizeNameAr: variant.size.nameAr,
        sizeNameEn: variant.size.nameEn,
        unitPrice,
        quantity: item.quantity,
        subtotal,
      });
    }

    const orderNumber = this.generateOrderNumber();

    // Fetch WhatsApp template and target number from StoreSettings
    const [templateSetting, waNumberSetting] = await Promise.all([
      this.prisma.storeSetting.findUnique({ where: { key: 'whatsapp_order_template_ar' } }),
      this.prisma.storeSetting.findUnique({ where: { key: 'whatsapp_number' } }),
    ]);

    const targetNumber = waNumberSetting?.value || '+201012345678';
    const firstItem = orderItemsData[0];
    const allProductNames = Array.from(new Set(orderItemsData.map((i) => i.productNameAr))).join(', ');
    const allSizes = Array.from(new Set(orderItemsData.map((i) => i.sizeNameAr))).join(', ');
    const allColors = Array.from(new Set(orderItemsData.map((i) => i.colorNameAr))).join(', ');
    const totalQty = orderItemsData.reduce((sum, i) => sum + i.quantity, 0);

    const itemsSummary = orderItemsData
      .map(
        (i) =>
          `• ${i.productNameAr} (${i.colorNameAr} / ${i.sizeNameAr}) x${i.quantity} = ${i.subtotal} EGP`,
      )
      .join('\n');

    const rawMessage =
      templateSetting?.value ||
      'مرحباً، أود تأكيد طلبي من المتجر:\nالطلب رقم: {orderNumber}\nالاسم: {customerName}\nالهاتف: {customerPhone}\nالعنوان: {customerAddress}\n\nالمنتجات:\n{itemsSummary}\n\nالإجمالي: {total} {currency}';

    const generatedMessage = rawMessage
      .replace(/\{orderNumber\}/gi, orderNumber)
      .replace(/\{customerName\}/gi, dto.customerName || '')
      .replace(/\{customerPhone\}/gi, dto.customerPhone || '')
      .replace(/\{phone\}/gi, dto.customerPhone || '')
      .replace(/\{customerAddress\}/gi, [dto.customerCity, dto.customerAddress].filter(Boolean).join(' - ') || 'غير محدد')
      .replace(/\{address\}/gi, [dto.customerCity, dto.customerAddress].filter(Boolean).join(' - ') || 'غير محدد')
      .replace(/\{city\}/gi, dto.customerCity || '')
      .replace(/\{itemsSummary\}/gi, itemsSummary)
      .replace(/\{items\}/gi, itemsSummary)
      .replace(/\{products\}/gi, itemsSummary)
      .replace(/\{productName\}/gi, allProductNames || (firstItem ? firstItem.productNameAr : ''))
      .replace(/\{size\}/gi, allSizes || (firstItem ? firstItem.sizeNameAr : ''))
      .replace(/\{color\}/gi, allColors || (firstItem ? firstItem.colorNameAr : ''))
      .replace(/\{quantity\}/gi, totalQty.toString())
      .replace(/\{notes\}/gi, dto.notes || 'لا يوجد')
      .replace(/\{total\}/gi, totalAmount.toFixed(2))
      .replace(/\{currency\}/gi, 'EGP');

    const whatsappUrl = `https://wa.me/${targetNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
      generatedMessage,
    )}`;

    // Execute atomic transaction: create order, create snapshot items, reserve/decrement stock
    const result = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          orderNumber,
          customerName: dto.customerName,
          customerPhone: dto.customerPhone,
          customerCity: dto.customerCity,
          customerAddress: dto.customerAddress,
          notes: dto.notes,
          status: OrderStatus.PENDING,
          totalAmount,
          currency: 'EGP',
          whatsappMessage: generatedMessage,
          items: {
            create: orderItemsData,
          },
        },
        include: {
          items: true,
        },
      });

      // Decrement stock
      for (const item of dto.items) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stockQuantity: { decrement: item.quantity } },
        });
      }

      return {
        order,
        whatsappUrl,
        whatsappMessage: generatedMessage,
      };
    });

    // Invalidate affected order, dashboard, and analytics caches
    this.cache.deleteByPrefix('orders:');
    this.cache.deleteByPrefix('dashboard:');
    this.cache.deleteByPrefix('analytics:');

    return result;
  }

  async findAll(query: { page?: number; limit?: number; status?: OrderStatus; search?: string }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const cacheKey = `orders:p_${page}:l_${limit}:s_${query.status || 'all'}:q_${query.search ? query.search.trim().toLowerCase() : ''}`;

    return this.cache.getOrSet(cacheKey, 15000, async () => {
      const where: Record<string, unknown> = {};
      if (query.status) where['status'] = query.status;
      if (query.search) {
        where['OR'] = [
          { orderNumber: { contains: query.search, mode: 'insensitive' } },
          { customerName: { contains: query.search, mode: 'insensitive' } },
          { customerPhone: { contains: query.search, mode: 'insensitive' } },
        ];
      }

      const [total, orders] = await Promise.all([
        this.prisma.order.count({ where }),
        this.prisma.order.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            items: true,
          },
        }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        items: orders,
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      };
    });
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return order;
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto, userId?: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    const updated = await this.prisma.order.update({
      where: { id },
      data: { status: dto.status },
    });

    // Invalidate affected caches immediately
    this.cache.deleteByPrefix('orders:');
    this.cache.deleteByPrefix('dashboard:');

    await this.auditService.log({
      userId,
      action: 'ORDER_STATUS_UPDATE',
      entity: 'Order',
      entityId: id,
      oldValues: { status: order.status },
      newValues: { status: dto.status },
    });

    return updated;
  }

  async remove(id: string, userId?: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    await this.prisma.orderItem.deleteMany({ where: { orderId: id } });
    await this.prisma.order.delete({ where: { id } });

    // Invalidate affected caches immediately
    this.cache.deleteByPrefix('orders:');
    this.cache.deleteByPrefix('dashboard:');

    await this.auditService.log({
      userId,
      action: 'ORDER_DELETE',
      entity: 'Order',
      entityId: id,
      oldValues: { orderNumber: order.orderNumber, customerName: order.customerName },
    });

    return { message: 'Order deleted successfully' };
  }
}