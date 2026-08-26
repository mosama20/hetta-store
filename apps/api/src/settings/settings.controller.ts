import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SettingGroup } from '@prisma/client';
import { SettingsService } from './settings.service';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';

@ApiTags('settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Public()
  @Get('public')
  @ApiOperation({ summary: 'Get public storefront settings (branding, WhatsApp number, currency)' })
  async getPublicSettings() {
    return this.settingsService.getPublicSettings();
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('settings.read')
  @ApiBearerAuth()
  @Get('backup/export')
  @ApiOperation({ summary: 'Export complete full-site store backup (Admin)' })
  async exportBackup() {
    return this.settingsService.exportBackup();
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('settings.write')
  @ApiBearerAuth()
  @Post('backup/import')
  @ApiOperation({ summary: 'Import and restore full-site store backup (Admin)' })
  async importBackup(
    @Body() backupPayload: any,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.settingsService.importBackup(backupPayload, user.id);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('settings.write')
  @ApiBearerAuth()
  @Post('backup/reset')
  @ApiOperation({ summary: 'Reset store settings to CRAFT defaults (Admin)' })
  async resetBackup(@CurrentUser() user: AuthenticatedUser) {
    return this.settingsService.resetBackup(user.id);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('settings.read')
  @ApiBearerAuth()
  @Get()
  @ApiOperation({ summary: 'Get all store settings (Admin)' })
  async getAllSettings() {
    return this.settingsService.getAllSettings();
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('settings.update')
  @ApiBearerAuth()
  @Put(':key')
  @ApiOperation({ summary: 'Update a specific store setting (Admin)' })
  async updateSetting(
    @Param('key') key: string,
    @Body('value') value: string,
    @Body('group') group: SettingGroup,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.settingsService.updateSetting(key, value, group, user.id);
  }
}
