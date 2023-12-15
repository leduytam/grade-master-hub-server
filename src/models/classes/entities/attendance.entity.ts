import { Exclude, Expose } from 'class-transformer';
import { User } from 'src/models/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EClassRole } from '../types/class-roles.enum';
import { Class } from './class.entity';

@Entity('attendances')
export class Attendance {
  @PrimaryGeneratedColumn('uuid')
  @Exclude({ toPlainOnly: true })
  id: string;

  @Column({ type: 'enum', enum: EClassRole, default: EClassRole.STUDENT })
  role: EClassRole;

  @ManyToOne(() => User, (user) => user.attendances, {
    onDelete: 'CASCADE',
  })
  user: User;

  @ManyToOne(() => Class, (classEntity) => classEntity.attendances, {
    onDelete: 'CASCADE',
  })
  classEntity: Class;

  @CreateDateColumn()
  @Expose({
    name: 'joinedAt',
    toPlainOnly: true,
  })
  createdAt: Date;
}
