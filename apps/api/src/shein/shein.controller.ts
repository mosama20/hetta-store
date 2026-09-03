import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SheinService } from './shein.service';
import { ExtractSheinUrlDto, CreateSheinOrderDto, UpdateSheinOrderStatusDto } from './dto/shein-order.dto';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { SheinOrderStatus } from '@prisma/client';

@ApiTags('shein')
@Controller('shein')
export class SheinController {
  constructor(private readonly sheinService: SheinService) { }

  @Public()
  @Post('extract')
  @ApiOperation({ summary: 'Extract product metadata from a SHEIN URL' })
  async extract(@Body() dto: ExtractSheinUrlDto) {
    return this.sheinService.extractMetadata(dto);
  }

  @Public()
  @Get('pricing')
  @ApiOperation({ summary: 'Get current SHEIN dynamic pricing configuration' })
  async getPricing() {
    return this.sheinService.getPricingConfig();
  }

  @Public()
  @Post('orders')
  @ApiOperation({ summary: 'Submit a new SHEIN concierge order' })
  async createOrder(@Body() dto: CreateSheinOrderDto) {
    return this.sheinService.createOrder(dto);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('orders.read')
  @ApiBearerAuth()
  @Get('orders')
  @ApiOperation({ summary: 'List all SHEIN orders with filters (Admin)' })
  async findAllOrders(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: SheinOrderStatus,
    @Query('search') search?: string,
  ) {
    return this.sheinService.findAllOrders({ page, limit, status, search });
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('orders.read')
  @ApiBearerAuth()
  @Get('orders/:id')
  @ApiOperation({ summary: 'Get SHEIN order details by ID (Admin)' })
  async findOneOrder(@Param('id') id: string) {
    return this.sheinService.findOneOrder(id);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('orders.update')
  @ApiBearerAuth()
  @Put('orders/:id/status')
  @ApiOperation({ summary: 'Update SHEIN order status (Admin)' })
  async updateOrderStatus(
    @Param('id') id: string,
    @Body() dto: UpdateSheinOrderStatusDto,
  ) {
    return this.sheinService.updateOrderStatus(id, dto);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('orders.delete')
  @ApiBearerAuth()
  @Delete('orders/:id')
  @ApiOperation({ summary: 'Delete a SHEIN order (Admin)' })
  async deleteOrder(@Param('id') id: string) {
    return this.sheinService.deleteOrder(id);
  }
}
