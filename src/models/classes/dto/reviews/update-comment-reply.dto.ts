import { PartialType } from '@nestjs/swagger';
import { CreateReviewCommentDto } from './create-comment.dto';

export class UpdateCommentReplyDto extends PartialType(
  CreateReviewCommentDto,
) {}
