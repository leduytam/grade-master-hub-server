import { registerAs } from '@nestjs/config';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import validateConfig from 'src/utils/validate-config';
import { IDatabaseConfig } from './types/config.interface';

class EnvironmentVariablesValidator {
  @ValidateIf((env) => env.DB_URL)
  @IsString()
  DB_URL: string;

  @ValidateIf((env) => !env.DB_URL)
  @IsString()
  @IsOptional()
  DB_TYPE: string;

  @ValidateIf((env) => !env.DB_URL)
  @IsString()
  @IsOptional()
  DB_HOST: string;

  @ValidateIf((env) => !env.DB_URL)
  @IsInt()
  @Min(0)
  @Max(65535)
  @IsOptional()
  DB_PORT: number;

  @ValidateIf((env) => !env.DB_URL)
  @IsString()
  DB_USERNAME: string;

  @ValidateIf((env) => !env.DB_URL)
  @IsString()
  DB_PASSWORD: string;

  @ValidateIf((env) => !env.DB_URL)
  @IsString()
  @IsOptional()
  DB_NAME: string;

  @IsBoolean()
  @IsOptional()
  DB_SYNCHRONIZE: boolean;

  @IsBoolean()
  @IsOptional()
  DB_MIGRATIONS_RUN: boolean;

  @IsString()
  @IsOptional()
  DB_TIMEZONE: string;

  @IsString()
  @IsOptional()
  DB_LOGGING: string;

  @IsBoolean()
  @IsOptional()
  DB_SSL_ENABLED: boolean;

  @IsBoolean()
  @IsOptional()
  DB_REJECT_UNAUTHORIZED: boolean;

  @IsString()
  @IsOptional()
  DB_CA: string;

  @IsString()
  @IsOptional()
  DB_KEY: string;

  @IsString()
  @IsOptional()
  DB_CERT: string;
}

export default registerAs<IDatabaseConfig>('database', (): IDatabaseConfig => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  return {
    type: process.env.DB_TYPE || 'postgres',
    url: process.env.DB_URL,
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? +process.env.DB_PORT : 5432,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    name: process.env.DB_NAME || 'gmhdb',
    synchronize:
      process.env.DB_SYNCHRONIZE === undefined
        ? process.env.NODE_ENV !== 'production'
        : process.env.DB_SYNCHRONIZE === 'true',
    migrationsRun:
      process.env.DB_MIGRATIONS_RUN === undefined
        ? process.env.NODE_ENV === 'production'
        : process.env.DB_MIGRATIONS_RUN === 'true',
    timezone: process.env.DB_TIMEZONE,
    logging:
      process.env.DB_LOGGING == undefined
        ? process.env.NODE_ENV !== 'production'
          ? true
          : false
        : process.env.DB_LOGGING === 'true' ||
            process.env.DB_LOGGING === 'false'
          ? process.env.DB_LOGGING === 'true'
          : process.env.DB_LOGGING,
    ssl:
      process.env.DB_SSL_ENABLED === 'true'
        ? {
            rejectUnauthorized: process.env.DB_REJECT_UNAUTHORIZED === 'true',
            ca: process.env.DB_CA,
            key: process.env.DB_KEY,
            cert: process.env.DB_CERT,
          }
        : undefined,
  };
});
