import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Inject,
  Patch,
  Post,
  Req,
  SerializeOptions,
  forwardRef,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { Paginate, PaginateQuery, Paginated } from 'nestjs-paginate';
import { Auth } from 'src/common/decorators/auth.decorator';
import { ParamUUIDValidation } from 'src/common/decorators/param-uuid-validation.decorator';
import { ClassesService } from '../classes/classes.service';
import { Class } from '../classes/entities/class.entity';
import { EClassRole } from '../classes/types/class-roles.enum';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { EUserGroup } from './types/user-groups.enum';
import { EUserRole } from './types/user-roles.enum';
import { UsersService } from './users.service';

@ApiTags('Users')
@Controller({
  path: 'users',
  version: '1',
})
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => ClassesService))
    private readonly classesService: ClassesService,
  ) {}

  @Post()
  @SerializeOptions({
    groups: [EUserGroup.ADMIN],
  })
  @Auth(EUserRole.ADMIN)
  create(@Body() dto: CreateUserDto): Promise<User> {
    return this.usersService.create(dto);
  }

  @Get(':id')
  @SerializeOptions({
    groups: [EUserGroup.ADMIN],
  })
  @Auth(EUserRole.ADMIN)
  async findOne(@ParamUUIDValidation('id', User) id: string): Promise<User> {
    return this.usersService.findOne({
      where: {
        id,
      },
    });
  }

  @Get()
  @SerializeOptions({
    groups: [EUserGroup.ADMIN],
  })
  @Auth(EUserRole.ADMIN)
  findAll(@Paginate() query: PaginateQuery): Promise<Paginated<User>> {
    return this.usersService.findAllWithPaginate(query, true);
  }

  @Patch(':id')
  @SerializeOptions({
    groups: [EUserGroup.ADMIN],
  })
  @Auth(EUserRole.ADMIN)
  async update(
    @ParamUUIDValidation('id', User) id: string,
    @Body() body: UpdateUserDto,
  ): Promise<User> {
    return this.usersService.update(id, body);
  }

  @Delete(':id')
  @Auth(EUserRole.ADMIN)
  delete(
    @Req() req: Request,
    @ParamUUIDValidation('id', User) id: string,
  ): Promise<void> {
    if (req.user.id === id) {
      throw new ForbiddenException('You cannot delete yourself');
    }

    return this.usersService.delete(id);
  }

  @Patch(':id/soft-delete')
  @Auth(EUserRole.ADMIN)
  softDelete(
    @Req() req: Request,
    @ParamUUIDValidation('id', User) id: string,
  ): Promise<void> {
    if (req.user.id === id) {
      throw new ForbiddenException('You cannot delete yourself');
    }

    return this.usersService.softDelete(id);
  }

  @Post(':id/restore')
  @Auth(EUserRole.ADMIN)
  restore(@ParamUUIDValidation('id', User, true) id: string): Promise<void> {
    return this.usersService.restore(id);
  }

  @Get(':id/owned-classes')
  @Auth()
  findOwnClasses(
    @Req() req: Request,
    @ParamUUIDValidation('id', User) id: string,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Class>> {
    if (req.user.role !== EUserRole.ADMIN && req.user.id !== id) {
      throw new ForbiddenException("You cannot view other user's classes");
    }

    return this.classesService.findOwnedClasses(id, query);
  }

  @Get(':id/classes/student')
  @Auth()
  findJoinedClassesAsStudent(
    @Req() req: Request,
    @ParamUUIDValidation('id', User) id: string,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Class>> {
    if (req.user.role !== EUserRole.ADMIN && req.user.id !== id) {
      throw new ForbiddenException("You cannot view other user's classes");
    }

    return this.classesService.findJoinedClasses(id, query, EClassRole.STUDENT);
  }

  @Get(':id/classes/teacher')
  @Auth()
  findJoinedClassesAsTeacher(
    @Req() req: Request,
    @ParamUUIDValidation('id', User) id: string,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Class>> {
    if (req.user.role !== EUserRole.ADMIN && req.user.id !== id) {
      throw new ForbiddenException("You cannot view other user's classes");
    }

    return this.classesService.findJoinedClasses(id, query, EClassRole.TEACHER);
  }
}
