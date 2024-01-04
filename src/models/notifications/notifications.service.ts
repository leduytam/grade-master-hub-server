import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginateQuery, Paginated, paginate } from 'nestjs-paginate';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly repo: Repository<Notification>,
  ) {}

  async create(
    userId: string,
    body: Partial<Notification>,
  ): Promise<Notification> {
    const { title, description, type, data } = body;

    const notification = this.repo.create({
      title,
      description,
      type,
      data,
      user: { id: userId },
    });

    return await this.repo.save(notification);
  }

  async findAll(
    userId: string,
    query: PaginateQuery,
  ): Promise<Paginated<Notification>> {
    return paginate(query, this.repo, {
      relations: {
        user: true,
      },
      where: {
        user: {
          id: userId,
        },
      },
      sortableColumns: ['createdAt'],
      defaultSortBy: [['createdAt', 'DESC']],
    });
  }

  async countUnseen(userId: string): Promise<number> {
    return await this.repo.count({
      where: {
        user: {
          id: userId,
        },
        seen: false,
      },
    });
  }

  async seen(id: string): Promise<void> {
    await this.repo.update(id, {
      seen: true,
    });
  }

  async validatePermission(userId: string, id: string): Promise<void> {
    const notification = await this.repo.findOne({
      where: {
        id,
      },
      relations: ['user'],
    });

    if (notification.user.id !== userId) {
      throw new ForbiddenException(
        'You have no permission to this notification',
      );
    }
  }

  async createMany(
    userIds: string[],
    body: Partial<Notification>,
  ): Promise<Notification[]> {
    const { title, description, type, data } = body;

    const notifications = userIds.map((userId) =>
      this.repo.create({
        title,
        description,
        type,
        data,
        user: { id: userId },
      }),
    );

    return await this.repo.save(notifications);
  }
}
