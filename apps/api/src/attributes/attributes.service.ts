import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AttributesService {
  constructor(private readonly prisma: PrismaService) {}

  // Colors
  async getColors(includeInactive = false) {
    const where = includeInactive ? {} : { isActive: true };
    return this.prisma.color.findMany({ where, orderBy: { displayOrder: 'asc' } });
  }

  async createColor(data: {
    nameAr: string;
    nameEn: string;
    hexCode: string;
    displayOrder?: number;
  }) {
    return this.prisma.color.create({
      data: {
        nameAr: data.nameAr,
        nameEn: data.nameEn,
        hexCode: data.hexCode,
        displayOrder: data.displayOrder ?? 0,
        isActive: true,
      },
    });
  }

  async updateColor(
    id: string,
    data: { nameAr?: string; nameEn?: string; hexCode?: string; isActive?: boolean },
  ) {
    return this.prisma.color.update({ where: { id }, data });
  }

  // Sizes
  async getSizes(includeInactive = false) {
    const where = includeInactive ? {} : { isActive: true };
    return this.prisma.size.findMany({ where, orderBy: { displayOrder: 'asc' } });
  }

  async createSize(data: { nameAr: string; nameEn: string; displayOrder?: number }) {
    return this.prisma.size.create({
      data: {
        nameAr: data.nameAr,
        nameEn: data.nameEn,
        displayOrder: data.displayOrder ?? 0,
        isActive: true,
      },
    });
  }

  async updateSize(id: string, data: { nameAr?: string; nameEn?: string; isActive?: boolean }) {
    return this.prisma.size.update({ where: { id }, data });
  }
}
