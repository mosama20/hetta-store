import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
  IsArray,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'manager@fashionstore.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string = '';

  @ApiProperty({ example: 'Store@Password2026!' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string = '';

  @ApiProperty({ example: 'Ahmed Hassan' })
  @IsString()
  @IsNotEmpty()
  fullName: string = '';

  @ApiProperty({ example: '+201012345678', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({
    description: 'List of role UUIDs to assign to user',
    type: [String],
    required: false,
  })
  @IsArray()
  @IsUUID('all', { each: true })
  @IsOptional()
  roleIds?: string[];
}
