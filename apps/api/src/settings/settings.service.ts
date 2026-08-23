import { Injectable } from '@nestjs/common';
import { SettingGroup } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async getPublicSettings() {
    const settings = await this.prisma.storeSetting.findMany({
      where: { isPublic: true },
    });
    const result: Record<string, string> = {};
    settings.forEach((s) => {
      result[s.key] = s.value;
    });
    return result;
  }

  async getAllSettings() {
    return this.prisma.storeSetting.findMany();
  }

  async updateSetting(key: string, value: string, group?: SettingGroup, userId?: string) {
    const updated = await this.prisma.storeSetting.upsert({
      where: { key },
      update: { value, isPublic: true, ...(group ? { group } : {}) },
      create: { key, value, group: group || SettingGroup.GENERAL, isPublic: true },
    });

    await this.auditService.log({
      userId,
      action: 'SETTING_UPDATE',
      entity: 'StoreSetting',
      entityId: key,
      newValues: { value, group },
    });

    return updated;
  }
}
