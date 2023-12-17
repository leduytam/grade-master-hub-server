import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FilterOperator,
  FilterSuffix,
  PaginateQuery,
  Paginated,
  paginate,
} from 'nestjs-paginate';
import {
  DeleteResult,
  FindManyOptions,
  FindOneOptions,
  Repository,
  UpdateResult,
} from 'typeorm';
import { EUserRole } from '../users/types/user-roles.enum';
import { UsersService } from './../users/users.service';
import { ClassesService } from './classes.service';
import { CompositionsService } from './compositions.service';
import { CreateReviewCommentDto } from './dto/reviews/create-comment.dto';
import { CreateReplyCommentDto } from './dto/reviews/create-reply.dto';
import { CreateReviewDto } from './dto/reviews/create-review.dto';
import { UpdateReviewStatusDto } from './dto/reviews/update-review-status.dto';
import { Grade } from './entities/grade.entity';
import { ReviewComment } from './entities/review-comment.entity';
import { Review } from './entities/review.entity';
import { EClassRole } from './types/class-roles.enum';
import { EReviewStatus } from './types/review-statuses.enum';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review) private readonly repo: Repository<Review>,
    @InjectRepository(ReviewComment)
    private readonly commentsRepo: Repository<ReviewComment>,
    @InjectRepository(Grade)
    private readonly gradesRepo: Repository<Grade>,
    private readonly usersService: UsersService,
    private readonly classesService: ClassesService,
    private readonly compositionsService: CompositionsService,
  ) {}

  async create(userId: string, body: CreateReviewDto): Promise<Review> {
    const grade = await this.gradesRepo.findOne({
      where: {
        id: body.gradeId,
      },
      relations: [
        'composition',
        'student',
        'student.user',
        'composition.classEntity',
      ],
    });

    await this.compositionsService.validatePermission(
      userId,
      grade.composition.id,
      {
        role: EClassRole.STUDENT,
      },
    );

    if (!grade.student.user || grade.student.user.id !== userId) {
      throw new ForbiddenException('You are not allowed to do this action');
    }

    if (!grade.composition.finalized) {
      throw new BadRequestException('The composition is not finalized');
    }

    const foundReview = await this.repo.findOne({
      where: {
        grade: {
          id: grade.id,
        },
        status: EReviewStatus.PENDING,
      },
    });

    if (foundReview) {
      throw new BadRequestException('You already have a pending review');
    }

    return await this.repo.manager.transaction(async (manager) => {
      const review = manager.create(Review, {
        grade: {
          id: grade.id,
        },
        classEntity: {
          id: grade.composition.classEntity.id,
        },
        requester: {
          id: userId,
        },
        studentExplanation: body.explanation,
        studentCurrentGrade: grade.grade,
        studentExpectedGrade: body.expectedGrade,
      });

      const savedReview = await this.repo.save(review);

      // TODO: Send notification to all teachers in the class

      return savedReview;
    });
  }

  async findOne(options: FindOneOptions<Review>): Promise<Review> {
    return this.repo.findOne(options);
  }

  async findOneOrFail(options: FindOneOptions<Review>): Promise<Review> {
    return this.repo.findOneOrFail(options);
  }

  async findAll(options?: FindManyOptions<Review>): Promise<Review[]> {
    return this.repo.find(options);
  }

  async findAllWithPaginate(query: PaginateQuery): Promise<Paginated<Review>> {
    return paginate(query, this.repo, {
      relations: [
        'grade',
        'grade.composition',
        'grade.student',
        'requester',
        'endedBy',
      ],
      sortableColumns: ['createdAt', 'updatedAt'],
      defaultSortBy: [['updatedAt', 'DESC']],
      filterableColumns: {
        status: [FilterOperator.EQ, FilterSuffix.NOT],
      },
    });
  }

  async delete(id: string): Promise<DeleteResult> {
    return this.repo.delete(id);
  }

  async updateStatus(
    userId: string,
    id: string,
    body: UpdateReviewStatusDto,
  ): Promise<void> {
    const review = await this.findOneOrFail({
      where: {
        id,
      },
      relations: ['grade', 'grade.composition', 'grade.student'],
    });

    if (review.status !== EReviewStatus.PENDING) {
      throw new BadRequestException('Only pending reviews can be updated');
    }

    try {
      await this.repo.manager.transaction(async (manager) => {
        if (body.status === EReviewStatus.ACCEPTED) {
          await manager.update(
            Grade,
            {
              composition: {
                id: review.grade.composition.id,
              },
              student: {
                id: review.grade.student.id,
              },
            },
            {
              grade: body.finalGrade,
            },
          );
        }

        await manager.update(Review, id, {
          endedBy: {
            id: userId,
          },
          studentFinalGrade: body.finalGrade,
          status: body.status,
        });

        // TODO: Send notification to the account that mapped to the student
      });
    } catch (err) {
      Logger.error(err);
      throw new BadRequestException('Failed to update the review');
    }
  }

  async validatePermission(
    userId: string,
    reviewId: string,
    options?: {
      role?: EClassRole;
      allowAdmin?: boolean;
    },
  ) {
    const defaultOptions = {
      allowAdmin: true,
    };

    options = {
      ...defaultOptions,
      ...options,
    };

    const user = await this.usersService.findOneOrFail({
      where: {
        id: userId,
      },
    });

    if (options?.allowAdmin && user.role === EUserRole.ADMIN) {
      return;
    }

    const review = await this.findOneOrFail({
      where: {
        id: reviewId,
      },
      relations: [
        'requester',
        'classEntity',
        'grade',
        'grade.student',
        'grade.student.user',
      ],
    });

    const classRole = await this.classesService.getRoleInClass(
      userId,
      review.classEntity.id,
    );

    // If the user is not a student in the class
    // Or the options.role is not the same as the class role
    // Or the user is a student and does not match with the student or the requester in the review
    // Then not allowed
    if (
      !classRole ||
      (options.role && options.role !== classRole) ||
      (classRole === EClassRole.STUDENT &&
        (!review.grade.student.user ||
          review.grade.student.user.id !== userId ||
          review.requester.id !== userId))
    ) {
      throw new ForbiddenException('You are not allowed to do this action');
    }
  }

  async getCommentsInReview(
    reviewId: string,
    query: PaginateQuery,
  ): Promise<Paginated<ReviewComment>> {
    const qb = this.commentsRepo
      .createQueryBuilder('comment')
      .where('comment.review = :reviewId', { reviewId })
      .orderBy('comment.createdAt', 'DESC');

    return paginate(query, qb, {
      sortableColumns: ['createdAt'],
      defaultSortBy: [['createdAt', 'DESC']],
    });
  }

  async getCommentReply(_commentId: string): Promise<ReviewComment> {
    return null;
  }

  async createComment(
    _userId: string,
    _reviewId: string,
    _body: CreateReviewCommentDto,
  ): Promise<ReviewComment> {
    // TODO: implement later

    return null;
  }

  async createReply(
    _userId: string,
    _commentId: string,
    _body: CreateReplyCommentDto,
  ): Promise<ReviewComment> {
    // TODO: implement later

    return null;
  }

  async updateCommentReply(_id: string): Promise<UpdateResult> {
    // TODO: implement later

    return null;
  }

  async deleteCommentReply(_id: string): Promise<DeleteResult> {
    // TODO: implement later

    return null;
  }
}
