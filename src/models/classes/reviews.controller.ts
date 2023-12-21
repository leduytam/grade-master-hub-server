import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { Paginate, PaginateQuery, Paginated } from 'nestjs-paginate';
import { Auth } from 'src/common/decorators/auth.decorator';
import { ParamUUIDValidation } from 'src/common/decorators/param-uuid-validation.decorator';
import { EUserRole } from '../users/types/user-roles.enum';
import { CreateReviewCommentDto } from './dto/reviews/create-comment.dto';
import { CreateReplyCommentDto } from './dto/reviews/create-reply.dto';
import { CreateReviewDto } from './dto/reviews/create-review.dto';
import { UpdateCommentReplyDto } from './dto/reviews/update-comment-reply.dto';
import { UpdateReviewStatusDto } from './dto/reviews/update-review-status.dto';
import { ReviewComment } from './entities/review-comment.entity';
import { Review } from './entities/review.entity';
import { ReviewsService } from './reviews.service';
import { EClassRole } from './types/class-roles.enum';

@ApiTags('Reviews')
@Controller({
  version: '1',
  path: 'reviews',
})
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @Auth(EUserRole.USER)
  async create(
    @Req() req: Request,
    @Body() body: CreateReviewDto,
  ): Promise<Review> {
    return this.reviewsService.create(req.user.id, body);
  }

  @Get(':id')
  @Auth()
  async findOne(
    @Req() req: Request,
    @ParamUUIDValidation('id', Review) id: string,
  ): Promise<Review> {
    await this.reviewsService.validatePermission(req.user.id, id);

    return this.reviewsService.findOne({
      where: {
        id,
      },
      relations: [
        'grade',
        'grade.composition',
        'grade.student',
        'requester',
        'endedBy',
      ],
    });
  }

  @Patch(':id/status')
  @Auth()
  async updateStatus(
    @Req() req: Request,
    @ParamUUIDValidation('id', Review) id: string,
    @Body() body: UpdateReviewStatusDto,
  ): Promise<void> {
    await this.reviewsService.validatePermission(req.user.id, req.params.id, {
      role: EClassRole.TEACHER,
    });

    await this.reviewsService.updateStatus(req.user.id, id, body);
  }

  @Get(':reviewId/comments')
  @Auth()
  async getComments(
    @Req() req: Request,
    @ParamUUIDValidation('reviewId', Review) reviewId: string,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<ReviewComment>> {
    await this.reviewsService.validatePermission(req.user.id, reviewId);

    return this.reviewsService.getCommentsInReview(reviewId, query);
  }

  @Get(':reviewId/comments/:commentId/replies')
  @Auth()
  async getReplies(
    @Req() req: Request,
    @ParamUUIDValidation('reviewId', Review) reviewId: string,
    @ParamUUIDValidation('commentId', ReviewComment) commentId: string,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<ReviewComment>> {
    await this.reviewsService.validatePermission(req.user.id, reviewId);

    return this.reviewsService.getRepliesInComment(commentId, query);
  }

  @Post(':reviewId/comments')
  @Auth(EUserRole.USER)
  async createComment(
    @Req() req: Request,
    @ParamUUIDValidation('reviewId', Review) reviewId: string,
    @Body() body: CreateReviewCommentDto,
  ): Promise<ReviewComment> {
    await this.reviewsService.validatePermission(req.user.id, reviewId);

    return this.reviewsService.createComment(req.user.id, reviewId, body);
  }

  @Post(':reviewId/comments/:commentId/reply')
  @Auth(EUserRole.USER)
  async createReply(
    @Req() req: Request,
    @ParamUUIDValidation('reviewId', Review) reviewId: string,
    @ParamUUIDValidation('commentId', ReviewComment) commentId: string,
    @Body() body: CreateReplyCommentDto,
  ): Promise<ReviewComment> {
    await this.reviewsService.validatePermission(req.user.id, reviewId);

    return this.reviewsService.createReply(
      req.user.id,
      reviewId,
      commentId,
      body,
    );
  }

  @Get(':reviewId/comments/:id')
  @Auth()
  async getCommentOrReply(
    @Req() req: Request,
    @ParamUUIDValidation('reviewId', Review) reviewId: string,
    @ParamUUIDValidation('id', ReviewComment) commentId: string,
  ): Promise<ReviewComment> {
    await this.reviewsService.validatePermission(req.user.id, reviewId);

    return this.reviewsService.getCommentReply(commentId);
  }

  @Patch(':reviewId/comments/:id')
  @Auth()
  async updateCommentOrReply(
    @Req() req: Request,
    @ParamUUIDValidation('reviewId', Review) reviewId: string,
    @ParamUUIDValidation('id', ReviewComment) commentId: string,
    @Body() body: UpdateCommentReplyDto,
  ): Promise<void> {
    await this.reviewsService.validatePermission(req.user.id, reviewId);

    await this.reviewsService.updateCommentReply(commentId, body);
  }

  @Delete(':reviewId/comments/:id')
  @Auth()
  async deleteCommentOrReply(
    @Req() req: Request,
    @ParamUUIDValidation('reviewId', Review) reviewId: string,
    @ParamUUIDValidation('id', ReviewComment) commentId: string,
  ): Promise<void> {
    await this.reviewsService.validatePermission(req.user.id, reviewId);

    await this.reviewsService.deleteCommentReply(commentId);
  }
}
