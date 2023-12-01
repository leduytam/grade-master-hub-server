import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateMeDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @ApiProperty({
    required: false,
    example: 'John',
  })
  firstName: string | null;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
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
}
