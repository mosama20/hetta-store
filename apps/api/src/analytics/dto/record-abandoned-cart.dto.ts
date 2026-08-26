import { IsString, IsOptional, IsNumber, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RecordAbandonedCartDto {
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

  @ApiPropertyOptional({ description: 'Device type' })
  @IsOptional()
  @IsString()
  deviceType?: string;

  @ApiProperty({ description: 'Cart items' })
  @IsArray()
  items!: any[];

  @ApiPropertyOptional({ description: 'Total number of items' })
  @IsOptional()
  @IsNumber()
  itemsCount?: number;

  @ApiProperty({ description: 'Total cart value' })
  @IsNumber()
  totalValue!: number;

  @ApiPropertyOptional({ description: 'Currency code' })
  @IsOptional()
  @IsString()
  currency?: string;
}
