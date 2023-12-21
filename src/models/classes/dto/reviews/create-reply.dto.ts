import { IsNotEmpty, IsString } from 'class-validator';

export class CreateReplyCommentDto {
  @IsString()
  @IsNotEmpty()
  content: string;
}
