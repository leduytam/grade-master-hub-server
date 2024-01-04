import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import {
  FilterOperator,
  FilterSuffix,
  PaginateQuery,
  Paginated,
  paginate,
} from 'nestjs-paginate';
import {
  DeepPartial,
  FindManyOptions,
  FindOneOptions,
  Repository,
} from 'typeorm';
import { File } from '../files/entities/file.entity';
import { FilesService } from '../files/files.service';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly repo: Repository<User>,
    private readonly filesService: FilesService,
  ) {}

  async create(body: DeepPartial<User>): Promise<User> {
    return await this.repo.save(this.repo.create(body));
  }

  async findOne(options: FindOneOptions<User>): Promise<User> {
    return this.repo.findOne(options);
  }

  async findOneOrFail(options: FindOneOptions<User>): Promise<User> {
    return this.repo.findOneOrFail(options);
  }

  async find(options: FindManyOptions<User>): Promise<User[]> {
    return this.repo.find(options);
  }

  async findAllWithPaginate(
    query: PaginateQuery,
    withDeleted: boolean = false,
  ): Promise<Paginated<User>> {
    return paginate(query, this.repo, {
      relations: {
        avatar: true,
      },
      sortableColumns: [
        'id',
        'email',
        'firstName',
        'lastName',
        'dob',
        'status',
        'role',
        'createdAt',
      ],
      searchableColumns: ['id', 'email', 'firstName', 'lastName'],
      defaultSortBy: [['createdAt', 'DESC']],
      filterableColumns: {
        role: [FilterOperator.EQ, FilterSuffix.NOT],
        status: [FilterOperator.EQ, FilterSuffix.NOT],
      },
      withDeleted,
    });
  }

  async updateSave(id: string, payload: DeepPartial<User>): Promise<User> {
    return this.repo.save(
      this.repo.create({
        id,
        ...payload,
      }),
    );
  }

  async update(id: string, payload: DeepPartial<User>): Promise<User> {
    if (payload.password) {
      payload.password = await bcrypt.hash(payload.password, 10);
    }

    await this.repo.update(id, payload);
    return this.findOne({
      where: {
        id,
      },
    });
  }

  async delete(_id: string): Promise<void> {
    // TODO: cascade delete here
  }

  async softDelete(id: string): Promise<void> {
    await this.repo.softDelete(id);
  }

  async restore(id: string): Promise<void> {
    await this.repo.restore(id);
  }

  async uploadAvatar(
    userId: string,
    file: Express.Multer.File,
  ): Promise<{
    avatar: string;
  }> {
    const avatar = await this.filesService.uploadAndCreate(file);

    await this.update(userId, {
      avatar: {
        id: avatar.id,
      } as File,
    });

    return {
      avatar: avatar.path,
    };
  }

  async deleteAvatar(userId: string): Promise<void> {
    const user = await this.findOne({
      where: {
        id: userId,
      },
    });

    await this.repo.update(userId, {
      avatar: null,
    });

    await this.filesService.delete(user.avatar.id);
  }
}
