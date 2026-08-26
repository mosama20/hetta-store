import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductsDto } from './dto/query-products.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(query: QueryProductsDto) {
    const {
      page = 1,
      limit = 20,
      search,
      category,
      colorId,
      sizeId,
      minPrice,
      maxPrice,
      isFeatured,
      inStock,
      sortBy = 'newest',
      all = false,
    } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      deletedAt: null,
    };

    if (!all) {
      where.isActive = true;
    }

    if (isFeatured !== undefined) {
      where.isFeatured = isFeatured;
    }

    if (category) {
      where.category = {
        OR: [{ slug: category }, { id: category }],
      };
    }

    if (search) {
      where.OR = [
        { nameAr: { contains: search, mode: 'insensitive' } },
        { nameEn: { contains: search, mode: 'insensitive' } },
        { descriptionAr: { contains: search, mode: 'insensitive' } },
        { descriptionEn: { contains: search, mode: 'insensitive' } },
        { variants: { some: { sku: { contains: search, mode: 'insensitive' } } } },
      ];
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.basePrice = {};
      if (minPrice !== undefined) where.basePrice.gte = minPrice;
      if (maxPrice !== undefined) where.basePrice.lte = maxPrice;
    }

    if (colorId || sizeId || inStock) {
      where.variants = {
        some: {
          isActive: true,
          ...(colorId ? { colorId } : {}),
          ...(sizeId ? { sizeId } : {}),
          ...(inStock ? { stockQuantity: { gt: 0 } } : {}),
        },
      };
    }

    // Sorting
    let orderBy: Prisma.ProductOrderByWithRelationInput | Prisma.ProductOrderByWithRelationInput[] = { createdAt: 'desc' };
    if (sortBy === 'price_asc') orderBy = { basePrice: 'asc' };
    if (sortBy === 'price_desc') orderBy = { basePrice: 'desc' };
    if (sortBy === 'popular') orderBy = [{ isFeatured: 'desc' }, { createdAt: 'desc' }];

    const [total, products] = await Promise.all([
      this.prisma.product.count({ where }),
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          category: {
            select: { id: true, nameAr: true, nameEn: true, slug: true },
          },
          images: {
            orderBy: { displayOrder: 'asc' },
          },
          variants: {
            where: all ? {} : { isActive: true },
            include: {
              color: true,
              size: true,
            },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      items: products,
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  async findBySlug(slug: string) {
    const product = await this.prisma.product.findFirst({
      where: { slug, deletedAt: null, isActive: true },
      include: {
        category: true,
        images: { orderBy: { displayOrder: 'asc' } },
        variants: {
          where: { isActive: true },
          include: { color: true, size: true },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with slug '${slug}' not found`);
    }

    return product;
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, deletedAt: null },
      include: {
        category: true,
        images: { orderBy: { displayOrder: 'asc' } },
        variants: {
          include: { color: true, size: true },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async create(dto: CreateProductDto, userId?: string) {
    const existing = await this.prisma.product.findUnique({
      where: { slug: dto.slug.toLowerCase().trim() },
    });

    if (existing) {
      throw new BadRequestException(`Product with slug '${dto.slug}' already exists`);
    }

    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          categoryId: dto.categoryId,
          nameAr: dto.nameAr,
          nameEn: dto.nameEn,
          slug: dto.slug.toLowerCase().trim(),
          descriptionAr: dto.descriptionAr,
          descriptionEn: dto.descriptionEn,
          basePrice: dto.basePrice,
          isFeatured: dto.isFeatured ?? false,
          isActive: dto.isActive ?? true,
          seoTitleAr: dto.seoTitleAr,
          seoTitleEn: dto.seoTitleEn,
          seoDescAr: dto.seoDescAr,
          seoDescEn: dto.seoDescEn,
        },
      });

      // Images
      if (dto.images && dto.images.length > 0) {
        await tx.productImage.createMany({
          data: dto.images.map((img, index) => ({
            productId: product.id,
            url: img.url,
            altTextAr: img.altTextAr,
            altTextEn: img.altTextEn,
            colorId: img.colorId,
            displayOrder: img.displayOrder ?? index,
            isPrimary: img.isPrimary ?? index === 0,
          })),
        });
      }

      // Variants
      if (dto.variants && dto.variants.length > 0) {
        for (const v of dto.variants) {
          await tx.productVariant.create({
            data: {
              productId: product.id,
              colorId: v.colorId,
              sizeId: v.sizeId,
              sku: v.sku.toUpperCase().trim(),
              price: v.price ?? dto.basePrice,
              compareAtPrice: v.compareAtPrice,
              stockQuantity: v.stockQuantity ?? 0,
              lowStockThreshold: v.lowStockThreshold ?? 5,
              isActive: v.isActive ?? true,
            },
          });
        }
      }

      await this.auditService.log({
        userId,
        action: 'PRODUCT_CREATE',
        entity: 'Product',
        entityId: product.id,
        newValues: { ...dto },
      });

      return this.findOne(product.id);
    });
  }

  async update(id: string, dto: UpdateProductDto, userId?: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { variants: true, images: true },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    if (dto.slug && dto.slug !== product.slug) {
      const existing = await this.prisma.product.findUnique({
        where: { slug: dto.slug.toLowerCase().trim() },
      });
      if (existing) {
        throw new BadRequestException(`Product with slug '${dto.slug}' already exists`);
      }
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id },
        data: {
          categoryId: dto.categoryId,
          nameAr: dto.nameAr,
          nameEn: dto.nameEn,
          slug: dto.slug ? dto.slug.toLowerCase().trim() : undefined,
          descriptionAr: dto.descriptionAr,
          descriptionEn: dto.descriptionEn,
          basePrice: dto.basePrice,
          isFeatured: dto.isFeatured,
          isActive: dto.isActive,
          seoTitleAr: dto.seoTitleAr,
          seoTitleEn: dto.seoTitleEn,
          seoDescAr: dto.seoDescAr,
          seoDescEn: dto.seoDescEn,
        },
      });

      // Update images if provided
      if (dto.images !== undefined) {
        await tx.productImage.deleteMany({ where: { productId: id } });
        if (dto.images.length > 0) {
          await tx.productImage.createMany({
            data: dto.images.map((img, index) => ({
              productId: id,
              url: img.url,
              altTextAr: img.altTextAr,
              altTextEn: img.altTextEn,
              colorId: img.colorId,
              displayOrder: img.displayOrder ?? index,
              isPrimary: img.isPrimary ?? index === 0,
            })),
          });
        }
      }

      await this.auditService.log({
        userId,
        action: 'PRODUCT_UPDATE',
        entity: 'Product',
        entityId: id,
        oldValues: { ...product },
        newValues: { ...dto },
      });

      return this.findOne(id);
    });
  }

  async delete(id: string, userId?: string) {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Soft delete to protect historical orders
    await this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    await this.auditService.log({
      userId,
      action: 'PRODUCT_DELETE',
      entity: 'Product',
      entityId: id,
    });

    return { message: 'Product archived successfully' };
  }

  async adjustStock(variantId: string, quantityChange: number, userId?: string) {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
    });

    if (!variant) {
      throw new NotFoundException(`Variant with ID ${variantId} not found`);
    }

    const newStock = variant.stockQuantity + quantityChange;
    if (newStock < 0) {
      throw new BadRequestException('Stock cannot be reduced below zero');
    }

    const updated = await this.prisma.productVariant.update({
      where: { id: variantId },
      data: { stockQuantity: newStock },
    });

    await this.auditService.log({
      userId,
      action: 'STOCK_ADJUST',
      entity: 'ProductVariant',
      entityId: variantId,
      oldValues: { stockQuantity: variant.stockQuantity },
      newValues: { stockQuantity: newStock, quantityChange },
    });

    return updated;
  }

  async bulkImport(items: Array<{
    nameAr: string;
    nameEn: string;
    categoryName?: string;
    categorySlug?: string;
    basePrice: number;
    descriptionAr?: string;
    descriptionEn?: string;
    colorName?: string;
    sizeName?: string;
    sku?: string;
    stockQuantity?: number;
    imageUrl?: string;
    isFeatured?: boolean;
  }>) {
    let importedCount = 0;
    const errors: string[] = [];

    // Pre-fetch categories, colors, sizes for quick matching
    const allCategories = await this.prisma.category.findMany();
    const allColors = await this.prisma.color.findMany();
    const allSizes = await this.prisma.size.findMany();

    for (let i = 0; i < items.length; i++) {
      const row = items[i];
      if (!row.nameAr || !row.nameEn || !row.basePrice) {
        errors.push(`Row ${i + 1}: Name and base price are required`);
        continue;
      }

      try {
        // Match or resolve category
        let categoryId = '';
        if (row.categorySlug || row.categoryName) {
          const match = allCategories.find(
            (c) =>
              (row.categorySlug && c.slug.toLowerCase() === row.categorySlug.toLowerCase()) ||
              (row.categoryName && (c.nameAr === row.categoryName || c.nameEn.toLowerCase() === row.categoryName.toLowerCase())),
          );
          if (match) {
            categoryId = match.id;
          } else {
            // Auto create category
            const newSlug = (row.categorySlug || row.categoryName || 'category')
              .toLowerCase()
              .replace(/\s+/g, '-');
            const createdCat = await this.prisma.category.create({
              data: {
                nameAr: row.categoryName || row.categorySlug || 'قسم جديد',
                nameEn: row.categoryName || row.categorySlug || 'New Category',
                slug: newSlug + '-' + Math.floor(Math.random() * 1000),
              },
            });
            allCategories.push(createdCat);
            categoryId = createdCat.id;
          }
        } else if (allCategories.length > 0) {
          categoryId = allCategories[0].id;
        }

        // Match or resolve color
        let colorId = '';
        if (row.colorName) {
          const matchColor = allColors.find(
            (c) => c.nameAr === row.colorName || (row.colorName ? c.nameEn.toLowerCase() === row.colorName.toLowerCase() : false),
          );
          if (matchColor) {
            colorId = matchColor.id;
          } else {
            const createdCol = await this.prisma.color.create({
              data: {
                nameAr: row.colorName,
                nameEn: row.colorName,
                hexCode: '#222222',
              },
            });
            allColors.push(createdCol);
            colorId = createdCol.id;
          }
        } else if (allColors.length > 0) {
          colorId = allColors[0].id;
        }

        // Match or resolve size
        let sizeId = '';
        if (row.sizeName) {
          const matchSize = allSizes.find(
            (s) => s.nameEn.toLowerCase() === row.sizeName?.toLowerCase() || s.nameAr === row.sizeName,
          );
          if (matchSize) {
            sizeId = matchSize.id;
          } else {
            const createdSz = await this.prisma.size.create({
              data: {
                nameAr: row.sizeName,
                nameEn: row.sizeName,
              },
            });
            allSizes.push(createdSz);
            sizeId = createdSz.id;
          }
        } else if (allSizes.length > 0) {
          sizeId = allSizes[0].id;
        }

        // Check if product already exists in database or was created in this bulk run
        let product = await this.prisma.product.findFirst({
          where: {
            OR: [
              { nameEn: { equals: row.nameEn.trim(), mode: 'insensitive' } },
              { nameAr: { equals: row.nameAr.trim() } },
            ],
            deletedAt: null,
          },
        });

        if (!product) {
          const baseSlug = (row.nameEn || 'product')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
          const slug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`;

          product = await this.prisma.product.create({
            data: {
              categoryId,
              nameAr: row.nameAr.trim(),
              nameEn: row.nameEn.trim(),
              slug,
              basePrice: Number(row.basePrice),
              descriptionAr: row.descriptionAr || '',
              descriptionEn: row.descriptionEn || '',
              isFeatured: !!row.isFeatured,
              isActive: true,
            },
          });

          // Add primary image if provided
          if (row.imageUrl) {
            await this.prisma.productImage.create({
              data: {
                productId: product.id,
                url: row.imageUrl,
                isPrimary: true,
                displayOrder: 1,
              },
            });
          }
        }

        // Add or update variant (Color + Size)
        if (colorId && sizeId) {
          const existingVariant = await this.prisma.productVariant.findFirst({
            where: {
              productId: product.id,
              colorId,
              sizeId,
            },
          });

          const sku =
            row.sku ||
            `${product.slug.slice(0, 5).toUpperCase()}-${colorId.slice(-3).toUpperCase()}-${sizeId.slice(-3).toUpperCase()}`;

          if (existingVariant) {
            await this.prisma.productVariant.update({
              where: { id: existingVariant.id },
              data: {
                stockQuantity: Number(row.stockQuantity) || existingVariant.stockQuantity,
                price: Number(row.basePrice) || existingVariant.price,
                isActive: true,
              },
            });
          } else {
            await this.prisma.productVariant.create({
              data: {
                productId: product.id,
                colorId,
                sizeId,
                sku,
                price: Number(row.basePrice),
                stockQuantity: Number(row.stockQuantity) || 20,
                isActive: true,
              },
            });
          }
        }

        importedCount++;
      } catch (err: any) {
        errors.push(`Row ${i + 1}: ${err.message}`);
      }
    }

    return {
      success: true,
      importedCount,
      totalRows: items.length,
      errors,
    };
  }
}
