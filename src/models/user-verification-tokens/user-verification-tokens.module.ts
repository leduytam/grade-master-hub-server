import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserVerificationToken } from './entities/user-verification-token.entity';
import { UserVerificationTokensService } from './user-verification-tokens.service';

@Module({
  providers: [UserVerificationTokensService],
  imports: [TypeOrmModule.forFeature([UserVerificationToken])],
  exports: [UserVerificationTokensService],
})
export class UserVerificationTokensModule {}
