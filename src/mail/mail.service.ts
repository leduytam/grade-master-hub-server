import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import ms from 'ms';
import path from 'path';
import { IAllConfig } from 'src/configs/types/config.interface';
import { MailerService } from 'src/mailer/mailer.service';
import { MailData } from './types/mail.interface';

@Injectable()
export class MailService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService<IAllConfig>,
  ) {}

  async sendVerificationEmail(
    mailData: MailData<{
      userName: string;
      token: string;
      expiresIn: number;
    }>,
  ): Promise<void> {
    const { to, data } = mailData;

    const url = `${this.configService.get('app.clientUrl', {
      infer: true,
    })}/verify-email?token=${data.token}`;

    const templatePath = path.join(
      this.configService.get('app.workingDir', { infer: true }),
      'src',
      'mail',
      'templates',
      'verify-email.hbs',
    );

    const subject = 'GMH - Verify your email address';

    await this.mailerService.sendMail({
      to,
      subject,
      templatePath,
      context: {
        title: subject,
        appName: this.configService.get('app.name', { infer: true }),
        userName: data.userName,
        url,
        expiresIn: ms(data.expiresIn, { long: true }),
      },
    });
  }

  async sendResetPasswordEmail(
    mailData: MailData<{
      userName: string;
      token: string;
      expiresIn: number;
    }>,
  ): Promise<void> {
    const { to, data } = mailData;

    const url = `${this.configService.get('app.clientUrl', {
      infer: true,
    })}/reset-password?token=${data.token}`;

    const templatePath = path.join(
      this.configService.get('app.workingDir', { infer: true }),
      'src',
      'mail',
      'templates',
      'reset-password.hbs',
    );

    const subject = 'GMH - Reset your password';

    await this.mailerService.sendMail({
      to,
      subject,
      templatePath,
      context: {
        title: subject,
        appName: this.configService.get('app.name', { infer: true }),
        userName: data.userName,
        url,
        expiresIn: ms(data.expiresIn, { long: true }),
      },
    });
  }

  async sendVerifiedEmailSuccess(
    mailData: MailData<{
      userName: string;
    }>,
  ): Promise<void> {
    const { to, data } = mailData;

    const templatePath = path.join(
      this.configService.get('app.workingDir', { infer: true }),
      'src',
      'mail',
      'templates',
      'verified-email-success.hbs',
    );

    const subject = 'GMH - Verify email success';

    await this.mailerService.sendMail({
      to,
      subject,
      templatePath,
      context: {
        title: subject,
        appName: this.configService.get('app.name', { infer: true }),
        userName: data.userName,
      },
    });
  }

  async sendChangedPasswordSuccess(
    mailData: MailData<{
      userName: string;
    }>,
  ): Promise<void> {
    const { to, data } = mailData;

    const templatePath = path.join(
      this.configService.get('app.workingDir', { infer: true }),
      'src',
      'mail',
      'templates',
      'changed-password-success.hbs',
    );

    const subject = 'GMH - Change password success';

    await this.mailerService.sendMail({
      to,
      subject,
      templatePath,
      context: {
        title: subject,
        appName: this.configService.get('app.name', { infer: true }),
        userName: data.userName,
      },
    });
  }
}
