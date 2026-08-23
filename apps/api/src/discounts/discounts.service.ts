import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class DiscountsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(all = false) {
    const now = new Date();
    const where = all
      ? {}
      : {
          isActive: true,
          startDate: { lte: now },
          OR: [{ endDate: null }, { endDate: { gte: now } }],
        };

    return this.prisma.discount.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        discountProducts: {
          include: { product: { select: { id: true, nameAr: true, nameEn: true, slug: true } } },
        },
        discountCategories: {
          include: { category: { select: { id: true, nameAr: true, nameEn: true, slug: true } } },
        },
      },
    });
  }

  async create(dto: CreateDiscountDto, userId?: string) {
    if (dto.type === 'PERCENTAGE' && dto.value > 100) {
      throw new BadRequestException('Percentage discount cannot exceed 100%');
    }

    return this.prisma.$transaction(async (tx) => {
      const discount = await tx.discount.create({
        data: {
          nameAr: dto.nameAr,
          nameEn: dto.nameEn,
          type: dto.type,
          value: dto.value,
          startDate: new Date(dto.startDate),
          endDate: dto.endDate ? new Date(dto.endDate) : null,
          isActive: dto.isActive ?? true,
          applyToAll: dto.applyToAll ?? false,
        },
      });

      if (dto.productIds && dto.productIds.length > 0) {
        await tx.discountProduct.createMany({
          data: dto.productIds.map((productId) => ({
            discountId: discount.id,
            productId,
          })),
        });
      }

      if (dto.categoryIds && dto.categoryIds.length > 0) {
        await tx.discountCategory.createMany({
          data: dto.categoryIds.map((categoryId) => ({
            discountId: discount.id,
            categoryId,
          })),
        });
      }

      await this.auditService.log({
        userId,
        action: 'DISCOUNT_CREATE',
        entity: 'Discount',
        entityId: discount.id,
        newValues: { ...dto },
      });

      return discount;
    });
  }

  async delete(id: string, userId?: string) {
    const discount = await this.prisma.discount.findUnique({ where: { id } });
    if (!discount) {
      throw new NotFoundException(`Discount with ID ${id} not found`);
    }

    await this.prisma.discount.delete({ where: { id } });

    await this.auditService.log({
      userId,
      action: 'DISCOUNT_DELETE',
      entity: 'Discount',
      entityId: id,
    });

    return { message: 'Discount deleted successfully' };
  }
}
