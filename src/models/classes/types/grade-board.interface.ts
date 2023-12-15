import { Composition } from '../entities/composition.entity';
import { Student } from '../entities/student.entity';

export interface IGradeBoardHeader {
  student: Pick<Student, 'id' | 'name'>;

  compositions: Pick<
    Composition,
    'id' | 'name' | 'percentage' | 'finalized' | 'order'
  >[];

  total: string;
}

export interface IGradeBoardRow {
  student: Pick<Student, 'id' | 'name'>;

  compositions: {
    id: string;
    grade: number | null;
  }[];

  total: number | null;
}

export interface IGradeBoard {
  header: IGradeBoardHeader;
  rows: IGradeBoardRow[];
}
