import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ description: 'Current user password' })
  @IsString()
  @IsNotEmpty()
  currentPassword: string = '';

  @ApiProperty({ description: 'New password (min 8 characters)' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'New password must be at least 8 characters long' })
  newPassword: string = '';
}
