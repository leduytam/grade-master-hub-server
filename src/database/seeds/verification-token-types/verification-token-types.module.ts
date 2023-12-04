import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VerificationTokenType } from 'src/models/verification-token-types/entities/verification-token-type.entity';
import { VerificationTokenTypesSeedService } from './verification-token-types.service';

@Module({
  imports: [TypeOrmModule.forFeature([VerificationTokenType])],
  providers: [VerificationTokenTypesSeedService],
  exports: [VerificationTokenTypesSeedService],
})
export class VerificationTokenTypesSeedModule {}
