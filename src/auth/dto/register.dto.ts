import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsStrongPassword,
  Validate,
} from 'class-validator';
import { IsNotExist } from 'src/common/validators/is-not-exists.validator';

export class RegisterDto {
  @IsEmail()
  @IsNotEmpty()
  @Validate(IsNotExist, ['User'], {
    message: 'email is already in use',
  })
  @ApiProperty({
    example: 'user@yopmail.com',
  })
  email: string;

  @IsString()
  @IsNotEmpty()
  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minNumbers: 1,
    minSymbols: 1,
    minUppercase: 1,
  })
  @ApiProperty({
    example: 'Abc@123456',
  })
  password: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: 'John',
  })
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: 'Doe',
  })
  lastName: string;

  @IsDateString()
  @IsOptional()
  @ApiProperty({
    required: false,
    example: '1990-01-01',
  })
  dob: Date | null;
}
