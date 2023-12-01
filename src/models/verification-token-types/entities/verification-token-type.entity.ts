import * as changeCase from 'change-case';
import { IsNumber } from 'class-validator';
import { UserVerificationToken } from 'src/models/user-verification-tokens/entities/user-verification-token.entity';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';

@Entity('verification_tokens')
export class VerificationTokenType {
  @PrimaryColumn()
  @IsNumber()
  id: number;

  @Column({ type: String })
  name: string;

  @OneToMany(
    () => UserVerificationToken,
    (userVerificationToken) => userVerificationToken.tokenType,
  )
  verificationTokenToUsers: UserVerificationToken[];

  @BeforeInsert()
  @BeforeUpdate()
  async transformToSnakeCase() {
    this.name = changeCase.snakeCase(this.name);
  }
}
