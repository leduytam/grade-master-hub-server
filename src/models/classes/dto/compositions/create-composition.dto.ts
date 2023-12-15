import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUUID,
  Max,
  Min,
  Validate,
} from 'class-validator';
import { IsExists } from 'src/common/validators/is-exists.validator';
import { MAX_GRADE } from '../../constants';

export class CreateCompositionDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @Min(0)
  @Max(MAX_GRADE)
  @Transform(({ value }) => Number(value))
  percentage: number;

  @IsUUID()
  @Validate(IsExists, ['Class', 'id'], {
    message: 'Class does not exist',
  })
  classId: string;
}
