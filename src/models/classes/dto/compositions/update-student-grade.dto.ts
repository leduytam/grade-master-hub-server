import { Transform } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';
import { MAX_GRADE } from '../../constants';

export class UpdateStudentGradeDto {
  @IsInt()
  @Min(0)
  @Max(MAX_GRADE)
  @Transform(({ value }) => parseInt(value))
  grade: number;
}
