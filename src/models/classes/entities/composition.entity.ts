import { Exclude, Expose } from 'class-transformer';
import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Class } from './class.entity';
import { Grade } from './grade.entity';

@Entity('compositions')
@Check(`"percentage" >= 0 AND "percentage" <= 100`)
export class Composition {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: String })
  name: string;

  @Column({ type: Number })
  percentage: number;

  @Column({ type: Number })
  order: number;

  @Column({ type: Boolean, default: false })
  finalized: boolean;

  @ManyToOne(() => Class, (classEntity) => classEntity.compositions, {
    onDelete: 'CASCADE',
  })
  @Expose({
    name: 'class',
    toPlainOnly: true,
  })
  classEntity: Class;

  @OneToMany(() => Grade, (grade) => grade.composition)
  grades: Grade[];

  @CreateDateColumn()
  @Exclude({ toPlainOnly: true })
  createdAt: Date;

  @UpdateDateColumn()
  @Exclude({ toPlainOnly: true })
  updatedAt: Date;
}
