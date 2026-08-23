import { IsOptional, IsString, IsInt, Min, Max, IsBoolean, IsNumber } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class QueryProductsDto {
  @ApiProperty({ default: 1, required: false })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  page: number = 1;

  @ApiProperty({ default: 20, required: false })
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  @IsOptional()
  limit: number = 20;

  @ApiProperty({ required: false, description: 'Search term for name or SKU' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({ required: false, description: 'Category slug or ID' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({ required: false, description: 'Color ID' })
  @IsString()
  @IsOptional()
  colorId?: string;

  @ApiProperty({ required: false, description: 'Size ID' })
  @IsString()
  @IsOptional()
  sizeId?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  minPrice?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  maxPrice?: number;

  @ApiProperty({ required: false })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @ApiProperty({ required: false })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  @IsOptional()
  inStock?: boolean;

  @ApiProperty({
    required: false,
    enum: ['newest', 'price_asc', 'price_desc', 'popular'],
    default: 'newest',
  })
  @IsString()
  @IsOptional()
  sortBy?: 'newest' | 'price_asc' | 'price_desc' | 'popular' = 'newest';

  @ApiProperty({ required: false, description: 'Include inactive/draft products (Admin only)' })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  @IsOptional()
  all?: boolean;
}
