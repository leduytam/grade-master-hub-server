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
  studentActualGrade?: number | null;

  @Column({ type: 'enum', enum: EReviewStatus, default: EReviewStatus.OPENING })
  status: EReviewStatus;

  @ManyToOne(() => User, {
    nullable: true,
  })
  endedBy?: User | null;

  @ManyToOne(() => User, (user) => user.reviews, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  requester?: User | null;

  @OneToMany(() => ReviewComment, (comment) => comment.review)
  comments: ReviewComment[];

  @ManyToOne(() => Class, (classEntity) => classEntity.reviews, {
    onDelete: 'CASCADE',
  })
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
