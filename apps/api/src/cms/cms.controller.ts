import { Controller, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CmsService } from './cms.service';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';

@ApiTags('cms')
@Controller('cms')
export class CmsController {
  constructor(private readonly cmsService: CmsService) {}

  @Public()
  @Get('sections')
  @ApiOperation({ summary: 'Get active storefront CMS homepage sections' })
  async getActiveSections() {
    return this.cmsService.getActiveSections();
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('cms.read')
  @ApiBearerAuth()
  @Get('admin/sections')
  @ApiOperation({ summary: 'Get all CMS sections for admin configuration' })
  async getAllSections() {
    return this.cmsService.getAllSections();
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('cms.update')
  @ApiBearerAuth()
  @Put('sections/:key')
  @ApiOperation({ summary: 'Update dynamic section payload, titles or order (Admin)' })
  async updateSection(
    @Param('key') key: string,
    @Body() body: Record<string, unknown>,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.cmsService.upsertSection(key, body, user.id);
  }
}
