import { User } from 'src/models/users/entities/user.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'files' })
export class File {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: String, nullable: true, default: null })
  path: string;

  @OneToMany(() => User, (user) => user.avatar)
  users: User[];
}
