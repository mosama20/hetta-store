import { IsString, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RecordEventDto {
  @ApiProperty({ description: 'Session identifier' })
  @IsString()
  sessionId!: string;

  @ApiProperty({ description: 'Visitor identifier' })
  @IsString()
  visitorId!: string;

  @ApiPropertyOptional({ description: 'Visitor IP address' })
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiProperty({ description: 'Event type (e.g. page_view, view_product, add_to_cart, purchase)' })
  @IsString()
  eventType!: string;

  @ApiProperty({ description: 'Page path URL' })
  @IsString()
  path!: string;

  @ApiPropertyOptional({ description: 'Additional event payload details' })
  @IsOptional()
  @IsObject()
  payload?: Record<string, any>;
}
