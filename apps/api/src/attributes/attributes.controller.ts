import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AttributesService } from './attributes.service';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';

@ApiTags('attributes')
@Controller('attributes')
export class AttributesController {
  constructor(private readonly attributesService: AttributesService) {}

  @Public()
  @Get('colors')
  @ApiOperation({ summary: 'List garment colors' })
  async getColors() {
    return this.attributesService.getColors();
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('products.create')
  @ApiBearerAuth()
  @Post('colors')
  @ApiOperation({ summary: 'Create new color swatch' })
  async createColor(
    @Body() body: { nameAr: string; nameEn: string; hexCode: string; displayOrder?: number },
  ) {
    return this.attributesService.createColor(body);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('products.update')
  @ApiBearerAuth()
  @Put('colors/:id')
  @ApiOperation({ summary: 'Update color swatch' })
  async updateColor(
    @Param('id') id: string,
    @Body() body: { nameAr?: string; nameEn?: string; hexCode?: string; isActive?: boolean },
  ) {
    return this.attributesService.updateColor(id, body);
  }

  @Public()
  @Get('sizes')
  @ApiOperation({ summary: 'List garment sizes' })
  async getSizes() {
    return this.attributesService.getSizes();
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('products.create')
  @ApiBearerAuth()
  @Post('sizes')
  @ApiOperation({ summary: 'Create new size standard' })
  async createSize(@Body() body: { nameAr: string; nameEn: string; displayOrder?: number }) {
    return this.attributesService.createSize(body);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('products.update')
  @ApiBearerAuth()
  @Put('sizes/:id')
  @ApiOperation({ summary: 'Update size standard' })
  async updateSize(
    @Param('id') id: string,
    @Body() body: { nameAr?: string; nameEn?: string; isActive?: boolean },
  ) {
    return this.attributesService.updateSize(id, body);
  }
}
