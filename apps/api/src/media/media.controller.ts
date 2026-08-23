import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StorageProvider } from '@prisma/client';
import { MediaService } from './media.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';

@ApiTags('media')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get()
  @RequirePermissions('media.read')
  @ApiOperation({ summary: 'List media assets library (Admin)' })
  async findAll(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.mediaService.findAll({ page, limit });
  }

  @Post('register')
  @RequirePermissions('media.upload')
  @ApiOperation({ summary: 'Register uploaded media metadata in the database' })
  async register(
    @Body()
    body: {
      url: string;
      mimeType: string;
      fileSize: number;
      width?: number;
      height?: number;
      altTextAr?: string;
      altTextEn?: string;
      storageProvider?: StorageProvider;
      storageKey?: string;
    },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.mediaService.registerMedia({ ...body, userId: user.id });
  }

  @Delete(':id')
  @RequirePermissions('media.delete')
  @ApiOperation({ summary: 'Delete media record (Admin)' })
  async delete(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.mediaService.delete(id, user.id);
  }
}
