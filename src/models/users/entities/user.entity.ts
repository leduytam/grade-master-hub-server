import * as bcrypt from 'bcrypt';
import { Exclude, Expose, Transform } from 'class-transformer';
import { Attendance } from 'src/models/classes/entities/attendance.entity';
import { Class } from 'src/models/classes/entities/class.entity';
import { ReviewComment } from 'src/models/classes/entities/review-comment.entity';
import { Review } from 'src/models/classes/entities/review.entity';
import { Student } from 'src/models/classes/entities/student.entity';
import { File } from 'src/models/files/entities/file.entity';
import { Notification } from 'src/models/notifications/entities/notification.entity';
import { UserVerificationToken } from 'src/models/user-verification-tokens/entities/user-verification-token.entity';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EUserGroup } from '../types/user-groups.enum';
import { EUserProvider } from '../types/user-providers.enum';
import { EUserRole } from '../types/user-roles.enum';
import { EUserStatus } from '../types/user-statuses.enum';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: String, unique: true, nullable: true })
  email?: string | null;

  @Column({ type: String, nullable: true })
  @Exclude({ toPlainOnly: true })
  password?: string | null;

  @Column({ type: String })
  firstName: string;

  @Column({ type: String })
  lastName: string;

  @Column({ type: 'date', nullable: true })
  @Expose({ groups: [EUserGroup.ME, EUserGroup.ADMIN] })
  dob?: Date | null;

  @Column({ type: 'enum', enum: EUserProvider, default: EUserProvider.EMAIL })
  @Expose({ groups: [EUserGroup.ADMIN] })
  provider: EUserProvider;

  @Column({ type: String, nullable: true })
  @Expose({ groups: [EUserGroup.ADMIN] })
  googleId?: string | null;

  @Column({ type: String, nullable: true })
  @Expose({ groups: [EUserGroup.ADMIN] })
  facebookId?: string | null;

  @ManyToOne(() => File, (file) => file.users, {
    eager: true,
    onDelete: 'SET NULL',
  })
  @Transform(({ value }) => (value ? value.path : null), {
    toPlainOnly: true,
  })
  avatar?: File | null;

  @Column({ type: 'enum', enum: EUserRole, default: EUserRole.USER })
  @Expose({ groups: [EUserGroup.ME, EUserGroup.ADMIN] })
  role: EUserRole;

  @Column({ type: 'enum', enum: EUserStatus, default: EUserStatus.PENDING })
  @Expose({ groups: [EUserGroup.ADMIN] })
  status: EUserStatus;

  @CreateDateColumn()
  @Expose({ groups: [EUserGroup.ADMIN] })
  createdAt: Date;

  @UpdateDateColumn()
  @Expose({ groups: [EUserGroup.ADMIN] })
  updatedAt: Date;

  @DeleteDateColumn()
  @Expose({ groups: [EUserGroup.ADMIN] })
  deletedAt?: Date | null;

  @OneToMany(
    () => UserVerificationToken,
    (userVerificationToken) => userVerificationToken.user,
  )
  userVerificationTokens: UserVerificationToken[];

  @OneToMany(() => Class, (classEntity) => classEntity.owner)
  ownClasses: Class;

  @OneToMany(() => Attendance, (attendance) => attendance.user)
  attendances: Class[];

  @OneToMany(() => Student, (student) => student.user)
  students: Student[];

  @OneToMany(() => Review, (review) => review.requester)
  reviews: Review[];

  @OneToMany(() => ReviewComment, (comment) => comment.user)
  reviewComments: ReviewComment[];

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (!this.password) {
      return;
    }

    this.password = await bcrypt.hash(this.password, 10);
  }
}
