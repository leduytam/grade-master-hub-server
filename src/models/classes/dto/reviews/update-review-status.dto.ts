import { Transform } from 'class-transformer';
import { IsEnum, IsInt, Max, Min, ValidateIf } from 'class-validator';
import { MAX_GRADE } from '../../constants';
import { EReviewStatus } from '../../types/review-statuses.enum';

enum EUpdateReviewStatus {
  REJECTED = 'rejected',
  ACCEPTED = 'accepted',
}

export class UpdateReviewStatusDto {
  @IsEnum(EUpdateReviewStatus)
  status: EReviewStatus.REJECTED | EReviewStatus.ACCEPTED;

  @IsInt()
  @ValidateIf(({ status }) => status === EReviewStatus.ACCEPTED)
  @Min(0)
  @Max(MAX_GRADE)
  @Transform(({ value }) => parseInt(value))
  finalGrade: number;
}
