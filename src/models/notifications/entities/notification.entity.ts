import { User } from 'src/models/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ENotificationType } from '../types/notification-types.enum';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: String })
  title: string;

  @Column({ type: String })
  description: string;

  @Column({ type: Boolean, default: false })
  seen: boolean;

  @Column({ type: 'enum', enum: ENotificationType })
  type: ENotificationType;

  @Column({ type: String })
  data: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.notifications, {
    onDelete: 'CASCADE',
  })
  user: User;
}
