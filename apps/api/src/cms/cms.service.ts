import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class CmsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async getActiveSections() {
    return this.prisma.cMSSection.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async getAllSections() {
    return this.prisma.cMSSection.findMany({
      orderBy: { displayOrder: 'asc' },
    });
  }

  async upsertSection(
    key: string,
    data: {
      titleAr?: string;
      titleEn?: string;
      subtitleAr?: string;
      subtitleEn?: string;
      payload?: Record<string, unknown>;
      displayOrder?: number;
      isActive?: boolean;
    },
    userId?: string,
  ) {
    const updated = await this.prisma.cMSSection.update({
      where: { key },
      data: {
        titleAr: data.titleAr,
        titleEn: data.titleEn,
        subtitleAr: data.subtitleAr,
        subtitleEn: data.subtitleEn,
        payload: data.payload ? (data.payload as unknown as Prisma.InputJsonValue) : undefined,
        displayOrder: data.displayOrder,
        isActive: data.isActive,
      },
    });

    await this.auditService.log({
      userId,
      action: 'CMS_UPDATE',
      entity: 'CMSSection',
      entityId: key,
      newValues: { ...data },
    });

    return updated;
  }
}
