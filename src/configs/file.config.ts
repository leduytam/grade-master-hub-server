import { registerAs } from '@nestjs/config';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
import validateConfig from 'src/utils/validate-config';
import { IFileConfig } from './types/config.interface';

export enum EFileDriver {
  LOCAL = 'local',
  CLOUDINARY = 'cloudinary',
}

class EnvironmentVariablesValidator {
  @IsEnum(EFileDriver)
  FILE_DRIVER: EFileDriver;

  @IsNumber()
  @IsOptional()
  FILE_MAX_SIZE: number;

  @IsString()
  @IsOptional()
  FILE_LOCAL_FOLDER: string;

  @ValidateIf((env) => env.FILE_DRIVER === EFileDriver.CLOUDINARY)
  @IsString()
  CLOUDINARY_CLOUD_NAME: string;

  @ValidateIf((env) => env.FILE_DRIVER === EFileDriver.CLOUDINARY)
  @IsString()
  CLOUDINARY_API_KEY: string;

  @ValidateIf((env) => env.FILE_DRIVER === EFileDriver.CLOUDINARY)
  @IsString()
  CLOUDINARY_API_SECRET: string;
}

export default registerAs<IFileConfig>('file', (): IFileConfig => {
  validateConfig(process.env, EnvironmentVariablesValidator);

  const driver = process.env.FILE_DRIVER || EFileDriver.LOCAL;

  return {
    driver,
    maxSize: process.env.FILE_MAX_SIZE ? +process.env.FILE_MAX_SIZE : 5242880,
    local: {
      folder: process.env.FILE_LOCAL_FOLDER || 'uploads',
    },
    cloudinary:
      driver === EFileDriver.CLOUDINARY
        ? {
            cloudName: process.env.CLOUDINARY_CLOUD_NAME,
            apiKey: process.env.CLOUDINARY_API_KEY,
            apiSecret: process.env.CLOUDINARY_API_SECRET,
          }
        : undefined,
  };
});
