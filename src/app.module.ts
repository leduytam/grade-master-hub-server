import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import appConfig from './configs/app.config';
import databaseConfig from './configs/database.config';
import fileConfig from './configs/file.config';
import mailerConfig from './configs/mailer.config';
import { IAllConfig } from './configs/types/config.interface';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { MailModule } from './mail/mail.module';
import { MailerModule } from './mailer/mailer.module';
import { FilesModule } from './models/files/files.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, mailerConfig, databaseConfig, fileConfig],
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
  ],
})
export class AppModule {}
