import { registerAs } from '@nestjs/config';
import {
  IsBoolean,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import validateConfig from 'src/utils/validate-config';
import { IMailerConfig } from './config.interface';

class EnvironmentVariablesValidator {
  @IsInt()
  @Min(0)
  @Max(65535)
  @IsOptional()
  MAILER_PORT: number;

  @IsString()
  MAILER_HOST: string;

  @IsString()
  MAILER_USER: string;

  @IsString()
  MAILER_PASSWORD: string;

  @IsEmail()
  @IsOptional()
  MAILER_DEFAULT_EMAIL: string;

  @IsString()
  @IsOptional()
  MAILER_DEFAULT_NAME: string;

  @IsBoolean()
  @IsOptional()
  MAILER_IGNORE_TLS: boolean;

  @IsBoolean()
  @IsOptional()
  MAILER_SECURE: boolean;

  @IsBoolean()
  @IsOptional()
  MAILER_REQUIRE_TLS: boolean;
}

export default registerAs<IMailerConfig>('mailer', () => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  return {
    port: process.env.MAILER_PORT ? +process.env.MAILER_PORT : 587,
    host: process.env.MAILER_HOST,
    user: process.env.MAILER_USER,
    password: process.env.MAILER_PASSWORD,
    defaultEmail: process.env.MAILER_DEFAULT_EMAIL || 'noreply@gmh.com',
    defaultName: process.env.MAILER_DEFAULT_NAME || 'No reply',
    ignoreTLS: process.env.MAILER_IGNORE_TLS === 'true',
    secure: process.env.MAILER_SECURE === 'true',
    requireTLS: process.env.MAILER_REQUIRE_TLS === 'true',
  };
});
