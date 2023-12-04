import { BadRequestException, Module } from '@nestjs/common';
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import cloudinary from 'cloudinary';
import { diskStorage } from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { EFileDriver } from 'src/configs/file.config';
import { IAllConfig } from 'src/configs/types/config.interface';
import { File } from './entities/file.entity';
import { FilesService } from './files.service';

@Module({
  providers: [FilesService],
  exports: [MulterModule, FilesService],
  imports: [
    TypeOrmModule.forFeature([File]),
    MulterModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService<IAllConfig>) => {
        const storages = {
          [EFileDriver.LOCAL]: () => {
            return diskStorage({
              destination: `./public/${configService.get('file.local.folder', {
                infer: true,
              })}`,
              filename: (req, file, cb) => {
                cb(
                  null,
                  `${randomStringGenerator()}.${file.originalname
                    .split('.')
                    .pop()
                    ?.toLowerCase()}`,
                );
              },
            });
          },
          [EFileDriver.CLOUDINARY]: () => {
            cloudinary.v2.config({
              cloud_name: configService.get('file.cloudinary.cloudName', {
                infer: true,
              }),
              api_key: configService.get('file.cloudinary.apiKey', {
                infer: true,
              }),
              api_secret: configService.get('file.cloudinary.apiSecret', {
                infer: true,
              }),
            });

            return new CloudinaryStorage({
              cloudinary: cloudinary.v2,
              params: async (req, file) => {
                return {
                  // folder: '',
                  format: file.originalname.split('.').pop()?.toLowerCase(),
                  public_id: `${randomStringGenerator()}`,
                };
              },
            });
          },
        };

        return {
          fileFilter: (req, file, cb) => {
            if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
              return cb(
                new BadRequestException('Only image files are allowed!'),
                false,
              );
            }

            cb(null, true);
          },
          storage:
            storages[configService.get('file.driver', { infer: true })](),
          limits: {
            fileSize: configService.get('file.maxSize', { infer: true }),
          },
        };
      },
    }),
  ],
})
export class FilesModule {}
