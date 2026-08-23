import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DiscountsService } from './discounts.service';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';

@ApiTags('discounts')
@Controller('discounts')
export class DiscountsController {
  constructor(private readonly discountsService: DiscountsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List active store discounts and promotions' })
  async findAll(@Query('all') all?: string) {
    return this.discountsService.findAll(all === 'true');
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('discounts.create')
  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Create new promotion campaign (Admin)' })
  async create(@Body() dto: CreateDiscountDto, @CurrentUser() user: AuthenticatedUser) {
    return this.discountsService.create(dto, user.id);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('discounts.delete')
  @ApiBearerAuth()
  @Delete(':id')
  @ApiOperation({ summary: 'Delete promotion campaign (Admin)' })
  async delete(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.discountsService.delete(id, user.id);
  }
}
