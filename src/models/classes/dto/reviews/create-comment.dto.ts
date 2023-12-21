import { IsNotEmpty, IsString } from 'class-validator';

export class CreateReviewCommentDto {
  @IsString()
  @IsNotEmpty()
  content: string;
}
