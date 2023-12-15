import * as bcrypt from 'bcrypt';
import { User } from 'src/models/users/entities/user.entity';
import { VerificationTokenType } from 'src/models/verification-token-types/entities/verification-token-type.entity';
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';

@Entity('user_verification_tokens')
export class UserVerificationToken {
  @PrimaryColumn({ type: String })
  userId: string;

  @PrimaryColumn({ type: Number })
  tokenTypeId: number;

  @Column({ type: String })
  hash: string;

  @Column()
  expiresAt: Date;

  @ManyToOne(() => User, (user) => user.userVerificationTokens, {
    onDelete: 'CASCADE',
  })
  user: string;

  @ManyToOne(
    () => VerificationTokenType,
    (verificationTokenType) => verificationTokenType.verificationTokenToUsers,
    {
      onDelete: 'CASCADE',
    },
  )
  tokenType: number;

  @BeforeInsert()
  @BeforeUpdate()
  private async hashToken() {
    this.hash = await bcrypt.hash(this.hash, 10);
  }
}
