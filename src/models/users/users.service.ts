import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import {
  FilterOperator,
  FilterSuffix,
  PaginateQuery,
  Paginated,
  paginate,
} from 'nestjs-paginate';
import { DeepPartial, FindOptionsWhere, Repository } from 'typeorm';
import { File } from '../files/entities/file.entity';
import { FilesService } from '../files/files.service';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly repo: Repository<User>,
    private readonly filesService: FilesService,
  ) {}

  async create(dto: DeepPartial<User>): Promise<User> {
    return await this.repo.save(this.repo.create(dto));
  }

  async findOne(
    conditions: FindOptionsWhere<User> | FindOptionsWhere<User>[],
    withDeleted: boolean = false,
  ): Promise<User | null> {
    return await this.repo.findOne({
      where: conditions,
      withDeleted,
    });
  }

  async findOneById(
    id: User['id'],
    withDeleted: boolean = false,
  ): Promise<User | null> {
    const user = await this.repo.findOne({
      where: {
        id,
      },
      withDeleted,
    });

    return user;
  }

  async findOneByEmail(
    email: User['email'],
    withDeleted: boolean = false,
  ): Promise<User | null> {
    return await this.repo.findOne({
      where: {
        email,
      },
      withDeleted,
    });
  }

  async findAll(
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

  async updateSave(id: User['id'], payload: DeepPartial<User>): Promise<User> {
    await this.validateUserExist(id);

    return this.repo.save(
      this.repo.create({
        id,
        ...payload,
      }),
    );
  }

  async update(id: User['id'], payload: DeepPartial<User>): Promise<User> {
    await this.validateUserExist(id);

    if (payload.password) {
      payload.password = await bcrypt.hash(payload.password, 10);
    }

    await this.repo.update(id, payload);
    return this.findOneById(id);
  }

  async softDelete(id: User['id']): Promise<void> {
    await this.validateUserExist(id, true);
    await this.repo.softDelete(id);
  }

  async restore(id: User['id']): Promise<void> {
    await this.validateUserExist(id, true);
    await this.repo.restore(id);
  }

  async uploadAvatar(
    userId: User['id'],
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

  async deleteAvatar(userId: string) {
    const user = await this.findOneById(userId);

    await this.repo.update(userId, {
      avatar: null,
    });

    await this.filesService.delete(user.avatar.id);

    return {
      message: 'Avatar deleted successfully',
    };
  }

  private async validateUserExist(
    id: User['id'],
    withDeleted: boolean = false,
  ): Promise<User> {
    const user = await this.findOneById(id, withDeleted);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}
