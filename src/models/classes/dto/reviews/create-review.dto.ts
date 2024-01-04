import { Transform } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsString,
  IsUUID,
  Max,
  Min,
  Validate,
} from 'class-validator';
import { IsExists } from 'src/common/validators/is-exists.validator';
import { MAX_GRADE } from '../../constants';

export class CreateReviewDto {
  @IsString()
  @IsNotEmpty()
  explanation: string;

  @IsInt()
  @Min(0)
  @Max(MAX_GRADE)
  @Transform(({ value }) => parseInt(value))
  expectedGrade: number;

  @IsUUID()
  @Validate(IsExists, ['Grade', 'id'], {
    message: 'Grade id does not exist',
  })
  gradeId: string;
}
