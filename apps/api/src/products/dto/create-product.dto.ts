import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsArray,
  ValidateNested,
  IsUUID,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateVariantDto {
  @ApiProperty({ description: 'Color UUID' })
  @IsUUID()
  @IsNotEmpty()
  colorId: string = '';

  @ApiProperty({ description: 'Size UUID' })
  @IsUUID()
  @IsNotEmpty()
  sizeId: string = '';

  @ApiProperty({ example: 'HD-BLK-M' })
  @IsString()
  @IsNotEmpty()
  sku: string = '';

  @ApiProperty({ example: 850.0 })
  @IsNumber()
  @Min(0)
  price: number = 0;

  @ApiProperty({ example: 950.0, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  compareAtPrice?: number;

  @ApiProperty({ default: 0 })
  @IsNumber()
  @Min(0)
  stockQuantity: number = 0;

  @ApiProperty({ default: 5, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  lowStockThreshold?: number = 5;

  @ApiProperty({ default: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;
}

export class CreateProductImageDto {
  @ApiProperty({ example: 'https://images.unsplash.com/...' })
  @IsString()
  @IsNotEmpty()
  url: string = '';

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  altTextAr?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  altTextEn?: string;

  @ApiProperty({ required: false, description: 'Optional color affinity UUID' })
  @IsUUID()
  @IsOptional()
  colorId?: string;

  @ApiProperty({ default: 0, required: false })
  @IsNumber()
  @IsOptional()
  displayOrder?: number = 0;

  @ApiProperty({ default: false, required: false })
  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean = false;
}

export class CreateProductDto {
  @ApiProperty({ description: 'Category UUID' })
  @IsUUID()
  @IsNotEmpty()
  categoryId: string = '';

  @ApiProperty({ example: 'هودي أوفرسايز قطن' })
  @IsString()
  @IsNotEmpty()
  nameAr: string = '';

  @ApiProperty({ example: 'Oversized Cotton Hoodie' })
  @IsString()
  @IsNotEmpty()
  nameEn: string = '';

  @ApiProperty({ example: 'oversized-cotton-hoodie' })
  @IsString()
  @IsNotEmpty()
  slug: string = '';

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  descriptionAr?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  descriptionEn?: string;

  @ApiProperty({ example: 850.0 })
  @IsNumber()
  @Min(0)
  basePrice: number = 0;

  @ApiProperty({ default: false, required: false })
  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean = false;

  @ApiProperty({ default: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  seoTitleAr?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  seoTitleEn?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  seoDescAr?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  seoDescEn?: string;

  @ApiProperty({ type: [CreateVariantDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVariantDto)
  @IsOptional()
  variants?: CreateVariantDto[];

  @ApiProperty({ type: [CreateProductImageDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductImageDto)
  @IsOptional()
  images?: CreateProductImageDto[];
}
