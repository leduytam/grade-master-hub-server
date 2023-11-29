import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'files' })
export class File {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: String, nullable: true, default: null })
  path: string;
}
