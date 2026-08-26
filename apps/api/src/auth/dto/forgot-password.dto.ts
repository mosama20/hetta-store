import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'mohamed.osama5060@gmail.com', description: 'Registered user email address' })
  @IsEmail({}, { message: 'Please enter a valid email address' })
  @IsNotEmpty()
  email: string = '';
}
