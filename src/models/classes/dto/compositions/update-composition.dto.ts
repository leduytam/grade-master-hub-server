import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { MAX_GRADE } from '../../constants';

export class UpdateCompositionDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string | null;

  @IsNumber()
  @Min(0)
  @Max(MAX_GRADE)
  @IsOptional()
  @Transform(({ value }) => Number(value))
  percentage?: number | null;
}
