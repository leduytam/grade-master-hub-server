import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import dotenvFlow from 'dotenv-flow';
import appConfig from '../../configs/app.config';
import databaseConfig from '../../configs/database.config';
import { DatabaseModule } from '../database.module';
import { UsersSeedModule } from './users/users.module';
import { VerificationTokenTypesSeedModule } from './verification-token-types/verification-token-types.module';

dotenvFlow.config();

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig],
    }),
    DatabaseModule,
    VerificationTokenTypesSeedModule,
    UsersSeedModule,
  ],
})
export class SeedsModule {}
