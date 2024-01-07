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
import { NotificationsService } from '../notifications/notifications.service';
import { ENotificationType } from '../notifications/types/notification-types.enum';
import { EUserRole } from '../users/types/user-roles.enum';
import { UsersService } from './../users/users.service';
import { ClassesService } from './classes.service';
import { CompositionsService } from './compositions.service';
import { CreateReviewCommentDto } from './dto/reviews/create-comment.dto';
import { CreateReplyCommentDto } from './dto/reviews/create-reply.dto';
import { CreateReviewDto } from './dto/reviews/create-review.dto';
import { UpdateCommentReplyDto } from './dto/reviews/update-comment-reply.dto';
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
    private readonly notificationsService: NotificationsService,
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

      // send notification to all teachers in the class
      const user = await this.usersService.findOne({
        where: {
          id: userId,
        },
      });

      const teachers = await this.classesService.getAttendeesWithoutPaginate(
        grade.composition.classEntity.id,
        {
          role: EClassRole.TEACHER,
        },
      );

      const teacherIds = teachers
        .map((teacher) => teacher.user.id)
        .filter((id) => id !== userId);

      if (teacherIds.length > 0) {
        await this.notificationsService.createMany(teacherIds, {
          title: 'New review request',
          description: `${`${user.firstName} ${user.lastName}`} has requested a review for ${
            grade.composition.name
          }`,
          type: ENotificationType.GRADE_REVIEW_REQUESTED,
          data: JSON.stringify({
            classId: grade.composition.classEntity.id,
            reviewId: savedReview.id,
            compositionId: grade.composition.id,
          }),
        });
      }

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

  async findAllWithPaginate(
    classId: string,
    query: PaginateQuery,
  ): Promise<Paginated<Review>> {
    return paginate(query, this.repo, {
      relations: [
        'grade',
        'grade.composition',
        'grade.student',
        'requester',
        'requester.avatar',
        'endedBy',
      ],
      where: {
        classEntity: {
          id: classId,
        },
      },
      sortableColumns: ['createdAt', 'updatedAt'],
      defaultSortBy: [['updatedAt', 'DESC']],
      filterableColumns: {
        status: [FilterOperator.EQ, FilterSuffix.NOT],
      },
    });
  }

  async findAllMyReviewsWithPaginate(
    userId: string,
    classId: string,
    query: PaginateQuery,
  ): Promise<Paginated<Review>> {
    const student = await this.classesService.getMappedStudentId(
      userId,
      classId,
    );

    if (!student || !student.studentId) {
      throw new BadRequestException(
        'You are not mapped to a student in this class',
      );
    }

    return paginate(query, this.repo, {
      relations: [
        'grade',
        'grade.composition',
        'grade.student',
        'requester',
        'endedBy',
        'requester.avatar',
      ],
      where: {
        classEntity: {
          id: classId,
        },
        grade: {
          student: {
            id: student.studentId,
          },
        },
      },
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
      relations: [
        'grade',
        'grade.composition',
        'grade.student',
        'grade.composition.classEntity',
        'grade.student.user',
      ],
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
                classEntityId: review.grade.composition.classEntity.id,
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

        // send notification to the account that mapped to the student
        const user = await this.usersService.findOne({
          where: {
            id: userId,
          },
        });

        this.notificationsService.create(review.grade.student.user.id, {
          title: 'Review result',
          description: `${`${user.firstName} ${user.lastName}`} has ${
            body.status === EReviewStatus.ACCEPTED ? 'accepted' : 'rejected'
          } your review request for ${review.grade.composition.name}`,
          type: ENotificationType.MARK_REVIEW_DECISION,
          data: JSON.stringify({
            classId: review.grade.composition.classEntity.id,
            reviewId: review.id,
            compositionId: review.grade.composition.id,
          }),
        });
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

  async getCommentReply(commentId: string): Promise<ReviewComment> {
    const comment = await this.commentsRepo.findOne({
      where: {
        id: commentId,
      },
      relations: ['user', 'user.avatar', 'parent', 'review'],
    });

    return comment;
  }

  async getRepliesInComment(
    commentId: string,
    query: PaginateQuery,
  ): Promise<Paginated<ReviewComment>> {
    const qb = this.commentsRepo
      .createQueryBuilder('comment')
      .where('comment.parent = :commentId', { commentId })
      .orderBy('comment.createdAt', 'DESC');

    return paginate(query, qb, {
      sortableColumns: ['createdAt'],
      defaultSortBy: [['createdAt', 'DESC']],
    });
  }

  async createComment(
    userId: string,
    reviewId: string,
    body: CreateReviewCommentDto,
  ): Promise<ReviewComment> {
    const review = await this.findOne({
      where: {
        id: reviewId,
      },
      relations: [
        'requester',
        'requester.avatar',
        'grade',
        'grade.composition',
        'grade.composition.classEntity',
      ],
    });

    if (review.status !== EReviewStatus.PENDING) {
      throw new BadRequestException('Only pending reviews can be commented on');
    }

    const comment = this.commentsRepo.create({
      content: body.content,
      review: {
        id: reviewId,
      },
      user: {
        id: userId,
      },
    });

    const savedComment = await this.commentsRepo.save(comment);

    const notify = async () => {
      const user = await this.usersService.findOne({
        where: {
          id: userId,
        },
      });

      const commentsLevel1 = await this.commentsRepo.find({
        where: {
          review: {
            id: reviewId,
          },
          level: 1,
        },
        relations: ['user'],
      });

      // send notification to the requester if the comment is not from the requester
      if (review.requester.id !== userId) {
        this.notificationsService.create(review.requester.id, {
          title: 'New comment',
          description: `${`${user.firstName} ${user.lastName}`} has commented on your review request for ${
            review.grade.composition.name
          }`,
          type: ENotificationType.COMMENT,
          data: JSON.stringify({
            classId: review.grade.composition.classEntity.id,
            reviewId: review.id,
            compositionId: review.grade.composition.id,
            commentId: savedComment.id,
          }),
        });
      }

      // send notifications to all people who commented on the same level
      const commenters = commentsLevel1
        .filter((comment) => comment.user.id !== userId)
        .map((comment) => comment.user.id);

      if (commenters.length > 0) {
        this.notificationsService.createMany(commenters, {
          title: 'New comment',
          description: `${`${user.firstName} ${user.lastName}`} has commented on a review request for ${
            review.grade.composition.name
          }`,
          type: ENotificationType.COMMENT,
          data: JSON.stringify({
            classId: review.grade.composition.classEntity.id,
            reviewId: review.id,
            compositionId: review.grade.composition.id,
            commentId: savedComment.id,
          }),
        });
      }
    };

    notify();

    return this.commentsRepo.findOne({
      where: {
        id: savedComment.id,
      },
      relations: ['user', 'user.avatar'],
    });
  }

  async createReply(
    userId: string,
    reviewId: string,
    commentId: string,
    body: CreateReplyCommentDto,
  ): Promise<ReviewComment> {
    const review = await this.findOne({
      where: {
        id: reviewId,
      },
      relations: [
        'requester',
        'requester.avatar',
        'grade',
        'grade.composition',
        'grade.composition.classEntity',
      ],
    });

    if (review.status !== EReviewStatus.PENDING) {
      throw new BadRequestException('Only pending reviews can be commented on');
    }

    const comment = await this.commentsRepo.findOne({
      where: {
        id: commentId,
      },
      relations: ['user'],
    });

    const reply = this.commentsRepo.create({
      content: body.content,
      user: {
        id: userId,
      },
      parent: {
        id: commentId,
      },
      level: comment.level + 1,
    });

    const savedReply = await this.commentsRepo.save(reply);

    // send notification to the requester if the comment is not from the requester
    const notify = async () => {
      const user = await this.usersService.findOne({
        where: {
          id: userId,
        },
      });

      // notify to the user who replied if the comment is not from the user who replied
      // notify to the requester if the comment is not from the requester
      if (
        comment.user.id !== userId &&
        comment.user.id !== review.requester.id
      ) {
        this.notificationsService.create(comment.user.id, {
          title: 'New reply',
          description: `${`${user.firstName} ${user.lastName}`} has replied to your comment on a review request for ${
            review.grade.composition.name
          }`,
          type: ENotificationType.COMMENT_REPLY,
          data: JSON.stringify({
            classId: review.grade.composition.classEntity.id,
            reviewId: review.id,
            compositionId: review.grade.composition.id,
            commentId: savedReply.id,
          }),
        });
      } else if (review.requester.id !== userId) {
        this.notificationsService.create(review.requester.id, {
          title: 'New comment',
          description: `${`${user.firstName} ${user.lastName}`} has commented on your review request for ${
            review.grade.composition.name
          }`,
          type: ENotificationType.COMMENT,
          data: JSON.stringify({
            classId: review.grade.composition.classEntity.id,
            reviewId: review.id,
            compositionId: review.grade.composition.id,
            commentId: savedReply.id,
          }),
        });
      }

      // notify to all people who replied to the same comment
      const replies = await this.commentsRepo.find({
        where: {
          parent: {
            id: commentId,
          },
        },
        relations: ['user'],
      });

      const repliers = replies
        .filter(
          (reply) =>
            reply.user.id !== userId && reply.user.id !== review.requester.id,
          reply.user.id !== comment.user.id,
        )
        .map((reply) => reply.user.id);

      if (repliers.length > 0) {
        this.notificationsService.createMany(repliers, {
          title: 'New reply',
          description: `${`${user.firstName} ${user.lastName}`} has replied to a comment on a review request for ${
            review.grade.composition.name
          }`,
          type: ENotificationType.COMMENT_REPLY,
          data: JSON.stringify({
            classId: review.grade.composition.classEntity.id,
            reviewId: review.id,
            compositionId: review.grade.composition.id,
            commentId: savedReply.id,
          }),
        });
      }
    };

    notify();

    return this.commentsRepo.findOne({
      where: {
        id: savedReply.id,
      },
      relations: ['user', 'user.avatar'],
    });
  }

  async updateCommentReply(
    id: string,
    body: UpdateCommentReplyDto,
  ): Promise<UpdateResult> {
    return await this.commentsRepo.update(id, {
      content: body.content,
    });
  }

  async deleteCommentReply(id: string): Promise<DeleteResult> {
    return this.commentsRepo.delete(id);
  }
}
