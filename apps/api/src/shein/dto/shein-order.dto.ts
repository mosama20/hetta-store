import { IsString, IsNotEmpty, IsOptional, IsArray, ValidateNested, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ExtractSheinUrlDto {
  @ApiProperty({ description: 'SHEIN product URL or mobile shared link', example: 'https://ar.shein.com/goods-p-12345.html' })
  @IsString()
  @IsNotEmpty()
  url!: string;
}

export class CreateSheinOrderItemDto {
  @ApiProperty({ description: 'Original SHEIN product URL' })
  @IsString()
  @IsNotEmpty()
  productUrl!: string;

  @ApiProperty({ description: 'Product title in Arabic or English' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional({ description: 'Image URL' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'Selected Color' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ description: 'Selected Size' })
  @IsOptional()
  @IsString()
  size?: string;

  @ApiProperty({ description: 'Unit price in EGP' })
  @IsNumber()
  @Min(0)
  unitPrice!: number;

  @ApiProperty({ description: 'Quantity', default: 1 })
  @IsNumber()
  @Min(1)
  quantity!: number;

  @ApiPropertyOptional({ description: 'Special customer notes for this item' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateSheinOrderDto {
  @ApiProperty({ description: 'Customer full name' })
  @IsString()
  @IsNotEmpty()
  customerName!: string;

  @ApiProperty({ description: 'Customer phone number (WhatsApp)' })
  @IsString()
  @IsNotEmpty()
  customerPhone!: string;

  @ApiPropertyOptional({ description: 'Governorate / City' })
  @IsOptional()
  @IsString()
  customerCity?: string;

  @ApiPropertyOptional({ description: 'District / Area' })
  @IsOptional()
  @IsString()
  customerDistrict?: string;

  @ApiPropertyOptional({ description: 'Detailed street address' })
  @IsOptional()
  @IsString()
  customerAddress?: string;

  @ApiPropertyOptional({ description: 'Payment method', default: 'CASH_ON_DELIVERY' })
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiPropertyOptional({ description: 'General order notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ description: 'List of SHEIN items to order', type: [CreateSheinOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSheinOrderItemDto)
  items!: CreateSheinOrderItemDto[];
}

export class UpdateSheinOrderStatusDto {
  @ApiProperty({ description: 'New order status' })
  @IsString()
  @IsNotEmpty()
  status!: 'PENDING' | 'CONFIRMED' | 'PURCHASED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';
}
