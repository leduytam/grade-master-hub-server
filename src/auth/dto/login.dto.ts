import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ required: true, example: 'user@yopmail.com' })
  readonly email: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ required: true, example: 'Abc@123456' })
  readonly password: string;
}
