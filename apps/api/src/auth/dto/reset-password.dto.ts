import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ example: 'mohamed.osama5060@gmail.com', description: 'Registered user email address' })
  @IsEmail({}, { message: 'Please enter a valid email address' })
  @IsNotEmpty()
  email: string = '';

  @ApiProperty({ example: '123456', description: 'Reset verification code / token' })
  @IsString()
  @IsNotEmpty({ message: 'Reset code is required' })
  resetCode: string = '';

  @ApiProperty({ example: 'NewSecretPass2026!', description: 'New password (minimum 8 characters)' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  newPassword: string = '';
}
