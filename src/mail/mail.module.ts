import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MailerModule } from 'src/mailer/mailer.module';
import { MailService } from './mail.service';

@Module({
  providers: [MailService],
  imports: [ConfigModule, MailerModule],
  exports: [MailService],
})
export class MailModule {}
