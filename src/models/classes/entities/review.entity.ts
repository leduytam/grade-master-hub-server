import { Expose } from 'class-transformer';
import { User } from 'src/models/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EReviewStatus } from '../types/review-statuses.enum';
import { Class } from './class.entity';
import { Grade } from './grade.entity';
import { ReviewComment } from './review-comment.entity';

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: String })
  studentExplanation: string;

  @Column({ type: Number })
  studentExpectedGrade: number;

  @Column({ type: Number })
  studentCurrentGrade: number;

  @Column({ type: Number, nullable: true })
  studentFinalGrade?: number | null;

  @Column({ type: 'enum', enum: EReviewStatus, default: EReviewStatus.PENDING })
  status: EReviewStatus;

  @ManyToOne(() => User, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  endedBy?: User | null;

  @ManyToOne(() => User, (user) => user.reviews, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  requester?: User | null;

  @OneToMany(() => ReviewComment, (comment) => comment.review)
  comments: ReviewComment[];

  @ManyToOne(() => Grade, (grade) => grade.reviews, {
    onDelete: 'CASCADE',
  })
  grade: Grade;

  @ManyToOne(() => Class, (classEntity) => classEntity.reviews)
  @Expose({
    name: 'class',
    toPlainOnly: true,
  })
  classEntity: Class;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
