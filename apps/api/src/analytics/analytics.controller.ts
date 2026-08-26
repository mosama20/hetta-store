import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import type { Request } from 'express';
import { AnalyticsService } from './analytics.service';
import { RecordHitDto } from './dto/record-hit.dto';
import { RecordEventDto } from './dto/record-event.dto';
import { RecordAbandonedCartDto } from './dto/record-abandoned-cart.dto';
import { Public } from '../common/decorators/public.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';

function extractClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0].trim();
  }
  const realIp = req.headers['x-real-ip'];
  if (typeof realIp === 'string') {
    return realIp.trim();
  }
  return req.ip || req.socket?.remoteAddress || '127.0.0.1';
}

@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Public()
  @Post('hit')
  @ApiOperation({ summary: 'Record visitor session hit' })
  async recordHit(@Body() dto: RecordHitDto, @Req() req: Request) {
    const ip = extractClientIp(req);
    await this.analyticsService.recordHit(dto, ip);
    return { success: true };
  }

  @Public()
  @Post('event')
  @ApiOperation({ summary: 'Record behavioral analytics event' })
  async recordEvent(@Body() dto: RecordEventDto, @Req() req: Request) {
    const ip = extractClientIp(req);
    await this.analyticsService.recordEvent(dto, ip);
    return { success: true };
  }

  @Public()
  @Post('abandoned-cart')
  @ApiOperation({ summary: 'Record or update abandoned cart' })
  async recordAbandonedCart(@Body() dto: RecordAbandonedCartDto, @Req() req: Request) {
    const ip = extractClientIp(req);
    await this.analyticsService.recordAbandonedCart(dto, ip);
    return { success: true };
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('audit.read')
  @ApiBearerAuth()
  @Get('summary')
  @ApiOperation({ summary: 'Get visitor and marketing analytics summary (Admin)' })
  async getSummary(@Query('timeRange') timeRange?: 'today' | 'week' | 'month' | 'all') {
    return this.analyticsService.getSummary(timeRange);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('audit.read')
  @ApiBearerAuth()
  @Get('sessions')
  @ApiOperation({ summary: 'Get paginated visitor sessions (Admin)' })
  async getSessions(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('source') source?: string,
  ) {
    return this.analyticsService.getSessions({ page, limit, search, source });
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('audit.read')
  @ApiBearerAuth()
  @Get('events')
  @ApiOperation({ summary: 'Get paginated raw analytics events (Admin)' })
  async getEvents(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('eventType') eventType?: string,
  ) {
    return this.analyticsService.getEvents({ page, limit, eventType });
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('audit.read')
  @ApiBearerAuth()
  @Get('abandoned-carts')
  @ApiOperation({ summary: 'Get paginated abandoned cart items (Admin)' })
  async getAbandonedCarts(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.analyticsService.getAbandonedCarts({ page, limit });
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('audit.read')
  @ApiBearerAuth()
  @Delete('clear')
  @ApiOperation({ summary: 'Clear visitor tracking logs (Admin)' })
  async clearLogs() {
    return this.analyticsService.clearLogs();
  }
}
