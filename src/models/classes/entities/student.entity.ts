import { Exclude, Expose } from 'class-transformer';
import { User } from 'src/models/users/entities/user.entity';
import { Column, Entity, ManyToOne, OneToMany, PrimaryColumn } from 'typeorm';
import { Class } from './class.entity';
import { Grade } from './grade.entity';

@Entity('students')
export class Student {
  @PrimaryColumn({ type: String })
  id: string;

  @PrimaryColumn({ type: String })
  @Exclude({
    toPlainOnly: true,
  })
  classEntityId: string;

  @Column({ type: String })
  name: string;

  @ManyToOne(() => Class, (classEntity) => classEntity.students, {
    onDelete: 'CASCADE',
  })
  @Expose({
    name: 'class',
    toPlainOnly: true,
  })
  classEntity: Class;

  @OneToMany(() => Grade, (grade) => grade.student)
  grades: Grade[];

  @ManyToOne(() => User, (user) => user.students, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  user?: User | null;
}
