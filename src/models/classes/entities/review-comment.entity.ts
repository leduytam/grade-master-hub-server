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
import { Review } from './review.entity';

@Entity('review_comments')
export class ReviewComment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: String })
  content: string;

  @ManyToOne(() => ReviewComment, (comment) => comment.children, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  parent?: ReviewComment | null;

  @OneToMany(() => ReviewComment, (comment) => comment.parent)
  children: ReviewComment[];

  @Column({ type: Number, default: 1 })
  level: number;

  @ManyToOne(() => User, (user) => user.reviewComments, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  user?: User | null;

  @ManyToOne(() => Review, (review) => review.comments, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  review?: Review | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
