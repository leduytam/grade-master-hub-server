import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import appConfig from '../../configs/app.config';
import databaseConfig from '../../configs/database.config';
import { DatabaseModule } from '../database.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig],
    }),
    DatabaseModule,
  ],
})
export class SeedsModule {}