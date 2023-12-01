import { registerAs } from '@nestjs/config';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import validateConfig from 'src/utils/validate-config';
import { IAppConfig } from './types/config.interface';

enum EEnvironment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariablesValidator {
  @IsString()
  @IsOptional()
  APP_NAME: string;

  @IsEnum(EEnvironment)
  @IsOptional()
  NODE_ENV: EEnvironment;

  @IsInt()
  @Min(0)
  @Max(65535)
  @IsOptional()
  PORT: number;

  @IsString()
  @IsOptional()
  CLIENT_URL: string;

  @IsString()
  @IsOptional()
  SERVER_URL: string;
}

export default registerAs<IAppConfig>('app', (): IAppConfig => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  return {
    name: process.env.APP_NAME || 'Grade Master Hub',
    env: process.env.NODE_ENV || 'development',
    port: process.env.PORT ? +process.env.PORT : 8080,
    apiPrefix: 'api',
    workingDir: process.env.PWD || process.cwd(),
    clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
    serverUrl: process.env.SERVER_URL || 'http://localhost:8080',
  };
});
