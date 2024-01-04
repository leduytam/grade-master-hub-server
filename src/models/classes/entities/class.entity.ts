import { User } from 'src/models/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Attendance } from './attendance.entity';
import { Composition } from './composition.entity';
import { Invitation } from './invitation.entity';
import { Review } from './review.entity';
import { Student } from './student.entity';

@Entity('classes')
export class Class {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: String })
  name: string;

  @Column({ type: String, default: '' })
  description: string;

  @Column({ type: String, unique: true })
  code: string;

  @ManyToOne(() => User, (user) => user.ownClasses, {
    onDelete: 'CASCADE',
  })
  owner: User;

  @OneToMany(() => Student, (student) => student.classEntity)
  students: Student[];

  @OneToMany(() => Attendance, (attendance) => attendance.classEntity)
  attendances: Class[];

  @OneToMany(() => Invitation, (invitation) => invitation.classEntity)
  invitations: Invitation[];

  @OneToMany(() => Composition, (composition) => composition.classEntity)
  compositions: Composition[];

  @OneToMany(() => Review, (review) => review.classEntity)
  reviews: Review[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt?: Date | null;
}
