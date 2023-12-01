import { registerAs } from '@nestjs/config';
import { IsString } from 'class-validator';
import validateConfig from 'src/utils/validate-config';
import { IAuthConfig } from './types/config.interface';

class EnvironmentVariablesValidator {
  @IsString()
  AUTH_JWT_SECRET: string;

  @IsString()
  AUTH_JWT_TOKEN_EXPIRES_IN: string;

  @IsString()
  AUTH_REFRESH_SECRET: string;

  @IsString()
  AUTH_REFRESH_TOKEN_EXPIRES_IN: string;

  @IsString()
  AUTH_VERIFY_EMAIL_EXPIRES_IN: string;

  @IsString()
  AUTH_RESET_PASSWORD_EXPIRES_IN: string;

  @IsString()
  AUTH_GOOGLE_CLIENT_ID: string;

  @IsString()
  AUTH_GOOGLE_CLIENT_SECRET: string;

  @IsString()
  AUTH_FACEBOOK_CLIENT_ID: string;

  @IsString()
  AUTH_FACEBOOK_CLIENT_SECRET: string;
}

export default registerAs<IAuthConfig>('auth', (): IAuthConfig => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  return {
    jwtSecret: process.env.AUTH_JWT_SECRET,
    jwtExpires: process.env.AUTH_JWT_TOKEN_EXPIRES_IN,
    jwtRefreshSecret: process.env.AUTH_REFRESH_SECRET,
    jwtRefreshExpires: process.env.AUTH_REFRESH_TOKEN_EXPIRES_IN,
    verifyEmailExpires: process.env.AUTH_VERIFY_EMAIL_EXPIRES_IN,
    resetPasswordExpires: process.env.AUTH_RESET_PASSWORD_EXPIRES_IN,
    google: {
      clientId: process.env.AUTH_GOOGLE_CLIENT_ID,
      clientSecret: process.env.AUTH_GOOGLE_CLIENT_SECRET,
    },
    facebook: {
      clientId: process.env.AUTH_FACEBOOK_CLIENT_ID,
      clientSecret: process.env.AUTH_FACEBOOK_CLIENT_SECRET,
    },
  };
});
