import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsStrongPassword,
  Validate,
} from 'class-validator';
import { IsNotExists } from 'src/common/validators/is-not-exists.validator';
import { EUserRole } from '../types/user-roles.enum';
import { EUserStatus } from '../types/user-statuses.enum';

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  @Validate(IsNotExists, ['User'], {
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
  firstName: string | null;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: 'Doe',
  })
  lastName: string | null;

  @IsDateString()
  @IsOptional()
  @ApiProperty({
    example: '1990-01-01',
  })
  dob: Date | null;

  @IsEnum(EUserRole)
  @ApiProperty({
    enum: EUserRole,
    example: EUserRole.USER,
  })
  role?: EUserRole | null;

  @IsEnum(EUserStatus)
  @ApiProperty({
    enum: EUserStatus,
    example: EUserStatus.ACTIVE,
  })
  status?: EUserStatus | null;
}
