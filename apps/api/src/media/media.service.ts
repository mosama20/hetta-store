import { Injectable, NotFoundException } from '@nestjs/common';
import { StorageProvider } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class MediaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(query: { page?: number; limit?: number }) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 30;
    const skip = (page - 1) * limit;

    const [total, items] = await Promise.all([
      this.prisma.media.count(),
      this.prisma.media.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
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
  }

  async registerMedia(data: {
    url: string;
    mimeType: string;
    fileSize: number;
    width?: number;
    height?: number;
    altTextAr?: string;
    altTextEn?: string;
    storageProvider?: StorageProvider;
    storageKey?: string;
    userId?: string;
  }) {
    const record = await this.prisma.media.create({
      data: {
        url: data.url,
        mimeType: data.mimeType,
        fileSize: data.fileSize,
        width: data.width,
        height: data.height,
        altTextAr: data.altTextAr,
        altTextEn: data.altTextEn,
        storageProvider: data.storageProvider || StorageProvider.LOCAL,
        storageKey: data.storageKey,
        uploadedByUserId: data.userId,
      },
    });

    await this.auditService.log({
      userId: data.userId,
      action: 'MEDIA_UPLOAD',
      entity: 'Media',
      entityId: record.id,
      newValues: { url: data.url, mimeType: data.mimeType },
    });

    return record;
  }

  async delete(id: string, userId?: string) {
    const item = await this.prisma.media.findUnique({ where: { id } });
    if (!item) throw new NotFoundException(`Media with ID ${id} not found`);

    await this.prisma.media.delete({ where: { id } });

    await this.auditService.log({
      userId,
      action: 'MEDIA_DELETE',
      entity: 'Media',
      entityId: id,
    });

    return { message: 'Media record deleted successfully' };
  }
}
