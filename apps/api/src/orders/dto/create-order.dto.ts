import {
  IsNotEmpty,
  IsString,
  IsArray,
  ValidateNested,
  IsUUID,
  IsInt,
  Min,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrderItemDto {
  @ApiProperty({ description: 'Purchased Variant UUID' })
  @IsUUID()
  @IsNotEmpty()
  variantId: string = '';

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  quantity: number = 1;
}

export class CreateOrderDto {
  @ApiProperty({ example: 'Omar Khaled' })
  @IsString()
  @IsNotEmpty()
  customerName: string = '';

  @ApiProperty({ example: '+201012345678' })
  @IsString()
  @IsNotEmpty()
  customerPhone: string = '';

  @ApiProperty({ example: 'Cairo', required: false })
  @IsString()
  @IsOptional()
  customerCity?: string;

  @ApiProperty({ example: '15 El-Tahrir St, Dokki', required: false })
  @IsString()
  @IsOptional()
  customerAddress?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ type: [CreateOrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[] = [];
}
