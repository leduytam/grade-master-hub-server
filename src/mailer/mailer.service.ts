import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Handlebars from 'handlebars';
import * as fs from 'node:fs/promises';
import * as nodemailer from 'nodemailer';
import { IAllConfig } from 'src/configs/types/config.interface';

@Injectable()
export class MailerService {
  private readonly transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService<IAllConfig>) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('mailer.host', { infer: true }),
      port: this.configService.get('mailer.port', { infer: true }),
      ignoreTLS: this.configService.get('mailer.ignoreTLS', { infer: true }),
      secure: this.configService.get('mailer.secure', { infer: true }),
      requireTLS: this.configService.get('mailer.requireTLS', { infer: true }),
      auth: {
        user: this.configService.get('mailer.user', { infer: true }),
        pass: this.configService.get('mailer.password', { infer: true }),
      },
    });
  }

  async sendMail({
    templatePath,
    context,
    ...mailOptions
  }: nodemailer.SendMailOptions & {
    templatePath: string;
    context: Record<string, unknown>;
  }): Promise<void> {
    let html: string | undefined;

    if (templatePath) {
      const template = await fs.readFile(templatePath, 'utf-8');
      const compileTemplate = Handlebars.compile(template, {
        strict: true,
      });
      html = compileTemplate(context);
    }

    const defaultName = this.configService.get('mailer.defaultName', {
      infer: true,
    });

    const defaultEmail = this.configService.get('mailer.defaultEmail', {
      infer: true,
    });

    await this.transporter.sendMail({
      ...mailOptions,
      from: mailOptions.from || `"${defaultName}" <${defaultEmail}>`,
      html: mailOptions.html || html,
    });
  }
}
