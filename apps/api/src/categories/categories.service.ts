import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class CategoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(includeInactive = false) {
    const where = includeInactive ? {} : { isActive: true };
    return this.prisma.category.findMany({
      where,
      orderBy: { displayOrder: 'asc' },
      include: {
        parent: {
          select: { id: true, nameAr: true, nameEn: true, slug: true },
        },
        _count: {
          select: { products: true },
        },
      },
    });
  }

  async findTree() {
    const categories = await this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
      include: {
        _count: { select: { products: true } },
      },
    });

    const categoryMap = new Map();
    categories.forEach((cat) => {
      categoryMap.set(cat.id, { ...cat, children: [] });
    });

    const tree: unknown[] = [];
    categories.forEach((cat) => {
      if (cat.parentId && categoryMap.has(cat.parentId)) {
        categoryMap.get(cat.parentId).children.push(categoryMap.get(cat.id));
      } else if (!cat.parentId) {
        tree.push(categoryMap.get(cat.id));
      }
    });

    return tree;
  }

  async findBySlug(slug: string) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: {
        parent: true,
        children: { where: { isActive: true }, orderBy: { displayOrder: 'asc' } },
        _count: { select: { products: true } },
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with slug '${slug}' not found`);
    }

    return category;
  }

  async create(dto: CreateCategoryDto, userId?: string) {
    const existing = await this.prisma.category.findUnique({ where: { slug: dto.slug } });
    if (existing) {
      throw new BadRequestException(`Category slug '${dto.slug}' already in use`);
    }

    if (dto.parentId) {
      const parent = await this.prisma.category.findUnique({ where: { id: dto.parentId } });
      if (!parent) {
        throw new BadRequestException('Parent category does not exist');
      }
    }

    const created = await this.prisma.category.create({
      data: {
        nameAr: dto.nameAr,
        nameEn: dto.nameEn,
        slug: dto.slug.toLowerCase().trim(),
        descriptionAr: dto.descriptionAr,
        descriptionEn: dto.descriptionEn,
        imageUrl: dto.imageUrl,
        parentId: dto.parentId,
        displayOrder: dto.displayOrder ?? 0,
        isActive: dto.isActive ?? true,
      },
    });

    await this.auditService.log({
      userId,
      action: 'CATEGORY_CREATE',
      entity: 'Category',
      entityId: created.id,
      newValues: { ...created },
    });

    return created;
  }

  async update(id: string, dto: UpdateCategoryDto, userId?: string) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    if (dto.slug && dto.slug !== category.slug) {
      const existing = await this.prisma.category.findUnique({ where: { slug: dto.slug } });
      if (existing) {
        throw new BadRequestException(`Category slug '${dto.slug}' already in use`);
      }
    }

    if (dto.parentId) {
      if (dto.parentId === id) {
        throw new BadRequestException('Category cannot be its own parent');
      }
    }

    const updated = await this.prisma.category.update({
      where: { id },
      data: {
        ...dto,
        slug: dto.slug ? dto.slug.toLowerCase().trim() : undefined,
      },
    });

    await this.auditService.log({
      userId,
      action: 'CATEGORY_UPDATE',
      entity: 'Category',
      entityId: id,
      oldValues: { ...category },
      newValues: { ...updated },
    });

    return updated;
  }

  async delete(id: string, userId?: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true, children: true } } },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    await this.prisma.$transaction(async (tx) => {
      // 1. Decouple child categories (set parentId to this category's parentId or null)
      await tx.category.updateMany({
        where: { parentId: id },
        data: { parentId: category.parentId || null },
      });

      // 2. If there are products associated with this category, reassign them to a fallback category
      if (category._count.products > 0) {
        let fallbackCategory = await tx.category.findFirst({
          where: { id: { not: id } },
          orderBy: { displayOrder: 'asc' },
        });

        if (!fallbackCategory) {
          fallbackCategory = await tx.category.create({
            data: {
              nameAr: 'عام',
              nameEn: 'General',
              slug: `general-${Date.now().toString().slice(-4)}`,
              displayOrder: 0,
              isActive: true,
            },
          });
        }

        await tx.product.updateMany({
          where: { categoryId: id },
          data: { categoryId: fallbackCategory.id },
        });
      }

      // 3. Delete any discount associations
      await tx.discountCategory.deleteMany({
        where: { categoryId: id },
      });

      // 4. Delete the category itself
      await tx.category.delete({ where: { id } });
    });

    await this.auditService.log({
      userId,
      action: 'CATEGORY_DELETE',
      entity: 'Category',
      entityId: id,
      oldValues: { ...category },
    });

    return { message: 'Category deleted successfully' };
  }

  async reorder(items: { id: string; displayOrder: number }[], userId?: string) {
    await this.prisma.$transaction(
      items.map((item) =>
        this.prisma.category.update({
          where: { id: item.id },
          data: { displayOrder: item.displayOrder },
        }),
      ),
    );

    await this.auditService.log({
      userId,
      action: 'CATEGORY_REORDER',
      entity: 'Category',
      entityId: 'batch',
      newValues: { itemsCount: items.length },
    });

    return this.findAll(true);
  }
}
