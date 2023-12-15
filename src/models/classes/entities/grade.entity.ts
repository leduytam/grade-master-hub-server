import {
  Check,
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { MAX_GRADE } from '../constants';
import { Composition } from './composition.entity';
import { Student } from './student.entity';

@Entity('grades')
@Check(`"grade" >= 0 AND "grade" <= ${MAX_GRADE}`)
export class Grade {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: Number, nullable: true })
  grade?: number | null;

  @ManyToOne(() => Student, (student) => student.grades, {
    onDelete: 'CASCADE',
  })
  student: Student;

  @ManyToOne(() => Composition, (gradeComposition) => gradeComposition.grades, {
    onDelete: 'CASCADE',
  })
  composition: Composition;
}
