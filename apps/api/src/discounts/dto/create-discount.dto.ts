import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsDateString,
  IsArray,
  IsUUID,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DiscountType } from '@prisma/client';

export class CreateDiscountDto {
  @ApiProperty({ example: 'خصم الصيف 20%' })
  @IsString()
  @IsNotEmpty()
  nameAr: string = '';

  @ApiProperty({ example: 'Summer 20% Off' })
  @IsString()
  @IsNotEmpty()
  nameEn: string = '';

  @ApiProperty({ enum: DiscountType, example: DiscountType.PERCENTAGE })
  @IsEnum(DiscountType)
  @IsNotEmpty()
  type: DiscountType = DiscountType.PERCENTAGE;

  @ApiProperty({ example: 20.0 })
  @IsNumber()
  @Min(0.01)
  value: number = 0;

  @ApiProperty({ example: '2026-08-20T00:00:00Z' })
  @IsDateString()
  @IsNotEmpty()
  startDate: string = '';

  @ApiProperty({ example: '2026-09-20T00:00:00Z', required: false })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({ default: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;

  @ApiProperty({ default: false, required: false })
  @IsBoolean()
  @IsOptional()
  applyToAll?: boolean = false;

  @ApiProperty({ type: [String], required: false })
  @IsArray()
  @IsUUID('all', { each: true })
  @IsOptional()
  productIds?: string[];

  @ApiProperty({ type: [String], required: false })
  @IsArray()
  @IsUUID('all', { each: true })
  @IsOptional()
  categoryIds?: string[];
}
