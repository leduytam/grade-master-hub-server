import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import appConfig from './configs/app.config';
import databaseConfig from './configs/database.config';
import mailerConfig from './configs/mailer.config';
import { DatabaseModule } from './database/database.module';
import { MailModule } from './mail/mail.module';
import { MailerModule } from './mailer/mailer.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, mailerConfig, databaseConfig],
    }),
    DatabaseModule,
    MailerModule,
    MailModule,
  ],
})
export class AppModule {}
