import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Req,
  SerializeOptions,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { Paginate, PaginateQuery, Paginated } from 'nestjs-paginate';
import { JwtGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/user-roles.guard';
import { Roles } from 'src/common/validators/roles.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserIdParamsDto } from './dto/user-id-params.dto';
import { User } from './entities/user.entity';
import { EUserGroup } from './types/user-groups.enum';
import { EUserRole } from './types/user-roles.enum';
import { UsersService } from './users.service';

@ApiTags('Users')
@Roles(EUserRole.ADMIN)
@UseGuards(JwtGuard, RolesGuard)
@Controller({
  path: 'users',
  version: '1',
})
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @SerializeOptions({
    groups: [EUserGroup.ADMIN],
  })
  @ApiBearerAuth()
  create(@Body() dto: CreateUserDto): Promise<User> {
    return this.usersService.create(dto);
  }

  @Get(':id')
  @SerializeOptions({
    groups: [EUserGroup.ADMIN],
  })
  @ApiBearerAuth()
  async findOne(@Param() paramsDto: UserIdParamsDto): Promise<User | null> {
    const user = await this.usersService.findOneById(paramsDto.id, true);

    if (!user) {
      throw new NotFoundException('user id not found');
    }

    return user;
  }

  @Get()
  @SerializeOptions({
    groups: [EUserGroup.ADMIN],
  })
  @ApiBearerAuth()
  findAll(@Paginate() query: PaginateQuery): Promise<Paginated<User>> {
    return this.usersService.findAll(query, true);
  }

  @Patch(':id')
  @SerializeOptions({
    groups: [EUserGroup.ADMIN],
  })
  @ApiBearerAuth()
  async update(
    @Param() paramsDto: UserIdParamsDto,
    @Body() dto: UpdateUserDto,
  ): Promise<User> {
    return this.usersService.update(paramsDto.id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  delete(@Req() req: Request, @Param() dto: UserIdParamsDto): Promise<void> {
    if (req.user.id === dto.id) {
      throw new ForbiddenException('you cannot delete yourself');
    }

    return this.usersService.softDelete(dto.id);
  }

  @Post(':id/restore')
  @ApiBearerAuth()
  restore(@Param() dto: UserIdParamsDto): Promise<void> {
    return this.usersService.restore(dto.id);
  }
}
