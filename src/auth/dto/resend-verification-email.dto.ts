import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class ResendVerificationEmailDto {
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({
    example: 'user@yopmail.com',
  })
  email: string;
}
