import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IAllConfig } from 'src/configs/types/config.interface';
import { MailerService } from 'src/mailer/mailer.service';

@Injectable()
export class MailService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService<IAllConfig>,
  ) {}
}
