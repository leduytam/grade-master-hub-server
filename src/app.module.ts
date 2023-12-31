import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import dotenvFlow from 'dotenv-flow';
import { join } from 'path';
import { AuthModule } from './auth/auth.module';
import appConfig from './configs/app.config';
import authConfig from './configs/auth.config';
import databaseConfig from './configs/database.config';
import fileConfig from './configs/file.config';
import mailerConfig from './configs/mailer.config';
import { IAllConfig } from './configs/types/config.interface';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { MailModule } from './mail/mail.module';
import { MailerModule } from './mailer/mailer.module';
import { ClassesModule } from './models/classes/classes.module';
import { FilesModule } from './models/files/files.module';
import { NotificationsModule } from './models/notifications/notifications.module';
import { UsersModule } from './models/users/users.module';

dotenvFlow.config();

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, authConfig, mailerConfig, fileConfig],
    }),
    ServeStaticModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService<IAllConfig>) => {
        return [
          {
            rootPath: join(__dirname, '..', 'public'),
            serveRoot: `/${configService.get('app.apiPrefix', {
              infer: true,
            })}/static`,
            serveStaticOptions: {
              index: false,
            },
          },
        ];
      },
    }),
    DatabaseModule,
    MailerModule,
    MailModule,
    HealthModule,
    FilesModule,
    AuthModule,
    UsersModule,
    ClassesModule,
    NotificationsModule,
  ],
})
export class AppModule {}
