import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { EFileDriver } from 'src/configs/file.config';
import { IAllConfig } from 'src/configs/types/config.interface';
import { Repository } from 'typeorm';
import { File } from './entities/file.entity';

@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(File)
    private readonly repo: Repository<File>,
    private readonly configService: ConfigService<IAllConfig>,
  ) {}

  async create(path: string): Promise<File> {
    return this.repo.save({ path });
  }

  async uploadAndCreate(file: Express.Multer.File): Promise<File> {
    if (!file) {
      throw new BadRequestException('File not found');
    }

    const paths = {
      [EFileDriver.LOCAL]: `${this.configService.get('app.serverUrl', {
        infer: true,
      })}/static/${this.configService.get('file.local.folder', {
        infer: true,
      })}/${file.filename}`,
      [EFileDriver.CLOUDINARY]: file.path,
    };

    return this.repo.save({
      path: paths[this.configService.get('file.driver', { infer: true })],
    });
  }

  async delete(id: File['id']): Promise<void> {
    await this.repo.delete(id);
  }
}
