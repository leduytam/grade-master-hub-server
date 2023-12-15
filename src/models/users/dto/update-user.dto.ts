import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsStrongPassword,
} from 'class-validator';
import { EUserStatus } from '../types/user-statuses.enum';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {
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
    required: false,
    example: 'Abc@123456',
  })
  password: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    required: false,
    example: 'John',
  })
  firstName: string | null;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    required: false,
    example: 'Doe',
  })
  lastName: string | null;

  @IsDateString()
  @IsOptional()
  @ApiProperty({
    required: false,
    example: '1990-01-01',
  })
  dob: Date | null;

  @IsEnum(EUserStatus)
  @IsOptional()
  @ApiProperty({
    enum: EUserStatus,
    required: false,
  })
  status?: EUserStatus | null;
}
