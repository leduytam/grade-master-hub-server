import { Controller, Get, Patch, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { Paginate, PaginateQuery, Paginated } from 'nestjs-paginate';
import { Auth } from 'src/common/decorators/auth.decorator';
import { ParamUUIDValidation } from 'src/common/decorators/param-uuid-validation.decorator';
import { Notification } from './entities/notification.entity';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@Controller({
  path: 'notifications',
  version: '1',
})
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @Auth()
  findAll(
    @Req() req: Request,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Notification>> {
    return this.notificationsService.findAll(req.user.id, query);
  }

  @Get('count-unseen')
  @Auth()
  countUnseen(@Req() req: Request): Promise<number> {
    return this.notificationsService.countUnseen(req.user.id);
  }

  @Patch(':id/seen')
  @Auth()
  async seen(
    @Req() req: Request,
    @ParamUUIDValidation('id', Notification) id: string,
  ): Promise<void> {
    await this.notificationsService.validatePermission(req.user.id, id);

    return this.notificationsService.seen(id);
  }
}
