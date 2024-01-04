import { Expose } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { EClassRole } from '../types/class-roles.enum';
import { Class } from './class.entity';

@Entity('invitations')
export class Invitation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: String, unique: true })
  token: string;

  @Column({ type: 'enum', enum: EClassRole, default: EClassRole.STUDENT })
  role: EClassRole;

  @ManyToOne(() => Class, (classEntity) => classEntity.invitations, {
    onDelete: 'CASCADE',
  })
  @Expose({
    name: 'class',
    toPlainOnly: true,
  })
  classEntity: Class;

  @Column({ type: 'timestamptz' })
  expiredAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
