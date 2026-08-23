import { IsNotEmpty, IsString, IsOptional, IsUUID, IsBoolean, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ example: 'فساتين' })
  @IsString()
  @IsNotEmpty()
  nameAr: string = '';

  @ApiProperty({ example: 'Dresses' })
  @IsString()
  @IsNotEmpty()
  nameEn: string = '';

  @ApiProperty({ example: 'dresses' })
  @IsString()
  @IsNotEmpty()
  slug: string = '';

  @ApiProperty({ required: false, example: 'تشكيلة فساتين راقية' })
  @IsString()
  @IsOptional()
  descriptionAr?: string;

  @ApiProperty({ required: false, example: 'Luxury dresses collection' })
  @IsString()
  @IsOptional()
  descriptionEn?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiProperty({ required: false, description: 'Parent category UUID for nested taxonomy' })
  @IsUUID()
  @IsOptional()
  parentId?: string;

  @ApiProperty({ default: 0, required: false })
  @IsInt()
  @IsOptional()
  displayOrder?: number = 0;

  @ApiProperty({ default: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;
}
