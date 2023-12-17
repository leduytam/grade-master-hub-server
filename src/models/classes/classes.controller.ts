import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  HttpCode,
  HttpStatus,
  MaxFileSizeValidator,
  ParseFilePipe,
  Patch,
  Post,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { stringify } from 'csv-stringify/sync';
import { Request, Response } from 'express';
import { Paginate, PaginateQuery, Paginated } from 'nestjs-paginate';
import { Auth } from 'src/common/decorators/auth.decorator';
import { ParamIdValidation } from 'src/common/decorators/param-id-validation.decorator';
import { ParamUUIDValidation } from 'src/common/decorators/param-uuid-validation.decorator';
import { EUserRole } from '../users/types/user-roles.enum';
import { ClassesService } from './classes.service';
import { CompositionsService } from './compositions.service';
import { ClassInviteDto } from './dto/classes/class-invite.dto';
import { CreateClassAsAdminDto } from './dto/classes/create-class-as-admin.dto';
import { CreateClassDto } from './dto/classes/create-class.dto';
import { CreateInviteTokenDto } from './dto/classes/create-invite-token.dto';
import { JoinClassWithCodeDto } from './dto/classes/join-class-with-code.dto';
import { JoinClassWithTokenDto } from './dto/classes/join-class-with-token.dto';
import { KickAttendeeDto } from './dto/classes/kick-attendee.dto';
import { MapStudentIdDto } from './dto/classes/map-student-id.dto';
import { UnmapStudentIdDto } from './dto/classes/unmap-student-id.dto';
import { UpdateClassDto } from './dto/classes/update-class.dto';
import { UpdateStudentDto } from './dto/classes/update-student.dto';
import { Attendance } from './entities/attendance.entity';
import { Class } from './entities/class.entity';
import { Composition } from './entities/composition.entity';
import { Grade } from './entities/grade.entity';
import { Review } from './entities/review.entity';
import { Student } from './entities/student.entity';
import { ReviewsService } from './reviews.service';
import { EClassRole } from './types/class-roles.enum';
import { IGradeBoard } from './types/grade-board.interface';

@ApiTags('Classes')
@Controller({
  version: '1',
  path: 'classes',
})
export class ClassesController {
  constructor(
    private readonly classesService: ClassesService,
    private readonly compositionsService: CompositionsService,
    private readonly reviewsService: ReviewsService,
  ) {}

  @Post()
  @Auth()
  @Auth(EUserRole.USER)
  create(@Req() req: Request, @Body() createClassDto: CreateClassDto) {
    return this.classesService.create(req.user.id, createClassDto);
  }

  @Post('admin')
  @Auth(EUserRole.ADMIN)
  createAsAdmin(@Body() dto: CreateClassAsAdminDto) {
    return this.classesService.createAsAdmin(dto);
  }

  @Get(':id')
  @Auth()
  async findOne(
    @Req() req: Request,
    @ParamUUIDValidation('id', Class) classId: string,
  ): Promise<Class> {
    await this.classesService.validatePermission(req.user.id, classId);

    if (req.user.role === EUserRole.ADMIN) {
      return this.classesService.findOne({
        where: {
          id: classId,
        },
        withDeleted: req.user.role === EUserRole.ADMIN,
      });
    }

    return this.classesService.findOneWithRole(req.user.id, classId);
  }

  @Get()
  @Auth(EUserRole.ADMIN)
  findAll(@Paginate() query: PaginateQuery): Promise<Paginated<Class>> {
    return this.classesService.findAllWithPaginate(query);
  }

  @Patch(':id')
  @Auth()
  async update(
    @Req() req: Request,
    @ParamUUIDValidation('id', Class) classId: string,
    @Body() body: UpdateClassDto,
  ): Promise<void> {
    await this.classesService.validatePermission(req.user.id, classId, {
      role: EClassRole.TEACHER,
    });

    return this.classesService.update(classId, body);
  }

  @Delete(':id')
  @Auth(EUserRole.ADMIN)
  async softDelete(
    @ParamUUIDValidation('id', Class) classId: string,
  ): Promise<void> {
    await this.classesService.softDelete(classId);
  }

  @Patch(':id/restore')
  @Auth(EUserRole.ADMIN)
  async restore(
    @ParamUUIDValidation('id', Class) classId: string,
  ): Promise<void> {
    await this.classesService.restore(classId);
  }

  @Patch(':id/leave')
  @Auth(EUserRole.USER)
  @HttpCode(HttpStatus.OK)
  async leave(
    @Req() req: Request,
    @ParamUUIDValidation('id', Class) classId: string,
  ): Promise<void> {
    await this.classesService.validatePermission(req.user.id, classId);
    await this.classesService.leave(req.user.id, classId);
  }

  @Post(':id/kick')
  @Auth()
  @HttpCode(HttpStatus.OK)
  async kick(
    @Req() req: Request,
    @ParamUUIDValidation('id', Class) classId: string,
    @Body() body: KickAttendeeDto,
  ) {
    await this.classesService.validatePermission(req.user.id, classId, {
      role: EClassRole.TEACHER,
    });

    if (!(await this.classesService.isJoinedAs(body.attendeeId, classId))) {
      throw new BadRequestException('Attendee is not joined to this class');
    }

    return this.classesService.kick(req.user.id, classId, body.attendeeId);
  }

  @Post(':id/students/upload')
  @Auth()
  @UseInterceptors(FileInterceptor('file'))
  async uploadStudentList(
    @Req() req: Request,
    @ParamUUIDValidation('id', Class) classId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize: 2 * 1024 * 1024, // 2MB
          }),
          new FileTypeValidator({
            fileType: 'text/csv',
          }),
        ],
      }),
    )
    file: Express.Multer.File,
  ): Promise<Student[]> {
    await this.classesService.validatePermission(req.user.id, classId, {
      onlyOwner: true,
    });

    return this.classesService.uploadStudentList(classId, file);
  }

  @Post(':id/invite-token')
  @Auth()
  async invite(
    @Req() req: Request,
    @ParamUUIDValidation('id', Class) classId: string,
    @Body() body: CreateInviteTokenDto,
  ): Promise<{ token: string }> {
    await this.classesService.validatePermission(req.user.id, classId, {
      role: EClassRole.TEACHER,
    });

    return this.classesService.createInviteToken(classId, body);
  }

  @Post(':id/invite')
  @Auth()
  async inviteByEmail(
    @Req() req: Request,
    @ParamUUIDValidation('id', Class) classId: string,
    @Body() body: ClassInviteDto,
  ): Promise<void> {
    await this.classesService.validatePermission(req.user.id, classId, {
      role: EClassRole.TEACHER,
    });

    return this.classesService.inviteByEmail(classId, body);
  }

  @Post('join-with-token')
  @Auth(EUserRole.USER)
  async joinWithToken(
    @Req() req: Request,
    @Body() body: JoinClassWithTokenDto,
  ): Promise<void> {
    return this.classesService.joinClassWithToken(req.user.id, body.token);
  }

  @Post('join-with-code')
  @Auth(EUserRole.USER)
  async joinWithCode(@Req() req: Request, @Body() body: JoinClassWithCodeDto) {
    return this.classesService.joinClassWithCode(req.user.id, body.code);
  }

  @Get(':id/attendees')
  @Auth()
  async getAttendees(
    @Req() req: Request,
    @ParamUUIDValidation('id', Class) classId: string,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Attendance>> {
    await this.classesService.validatePermission(req.user.id, classId);

    return await this.classesService.getAttendees(classId, query);
  }

  @Get(':id/students')
  @Auth()
  async getStudents(
    @Req() req: Request,
    @ParamUUIDValidation('id', Class) classId: string,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Student>> {
    await this.classesService.validatePermission(req.user.id, classId);

    return this.classesService.getStudents(classId, query);
  }

  @Get(':id/map-student-id')
  @Auth()
  async getMappedStudentId(
    @Req() req: Request,
    @ParamUUIDValidation('id', Class) classId: string,
  ): Promise<{ studentId: string }> {
    await this.classesService.validatePermission(req.user.id, classId);

    return this.classesService.getMappedStudentId(req.user.id, classId);
  }

  @Patch(':id/map-student-id')
  @Auth()
  async mapStudentId(
    @Req() req: Request,
    @ParamUUIDValidation('id', Class) classId: string,
    @Body() body: MapStudentIdDto,
  ): Promise<void> {
    await this.classesService.validatePermission(req.user.id, classId);

    return this.classesService.mapStudentId(req.user.id, classId, body);
  }

  @Patch(':id/unmap-student-id')
  @Auth()
  unmapStudentId(
    @Req() req: Request,
    @ParamUUIDValidation('id', Class) classId: string,
    @Body() body: UnmapStudentIdDto,
  ) {
    return this.classesService.unmapStudentId(req.user.id, classId, body);
  }

  @Get(':id/compositions')
  @Auth()
  async findAllCompositions(
    @Req() req: Request,
    @ParamUUIDValidation('id', Class) id: string,
  ): Promise<Composition[]> {
    await this.classesService.validatePermission(req.user.id, id);

    return await this.compositionsService.findAll({
      where: {
        classEntity: {
          id: id,
        },
      },
      order: {
        order: 'ASC',
      },
    });
  }

  @Get(':id/compositions/csv')
  @Auth()
  async exportAllCompositionsAsCSV(
    @Req() req: Request,
    @Res() res: Response,
    @ParamUUIDValidation('id', Class) id: string,
  ): Promise<void> {
    await this.classesService.validatePermission(req.user.id, id);

    const compositions = await this.compositionsService.findAll({
      where: {
        classEntity: {
          id: id,
        },
      },
      order: {
        order: 'ASC',
      },
    });

    const csv = stringify(
      compositions.map((composition) => ({
        name: composition.name,
        percentages: composition.percentage,
      })),
      {
        header: true,
      },
    );

    res.setHeader('Content-Type', 'text/csv');

    res.attachment('compositions.csv').send(csv);
  }

  @Get(':id/grade-board')
  @Auth()
  async getGradeBoard(
    @Req() req: Request,
    @ParamUUIDValidation('id', Class) id: string,
  ): Promise<IGradeBoard> {
    await this.classesService.validatePermission(req.user.id, id, {
      role: EClassRole.TEACHER,
    });

    return this.classesService.getGradeBoard(id);
  }

  @Get(':id/grade-board/csv')
  @Auth()
  async exportGradeBoardAsCSV(
    @Req() req: Request,
    @Res() res: Response,
    @ParamUUIDValidation('id', Class) id: string,
  ): Promise<void> {
    await this.classesService.validatePermission(req.user.id, id, {
      role: EClassRole.TEACHER,
    });

    const gradeBoard = await this.classesService.getGradeBoard(id);

    const headerColumns = [
      gradeBoard.header.student.id,
      gradeBoard.header.student.name,
      ...gradeBoard.header.compositions.map(
        (composition) => `${composition.name} (${composition.percentage}%)`,
      ),
      gradeBoard.header.total,
    ];

    const csv = stringify(
      gradeBoard.rows.map((row) => [
        row.student.id,
        row.student.name,
        ...row.compositions.map((composition) => composition.grade),
        row.total,
      ]),
      {
        columns: headerColumns,
        header: true,
      },
    );

    res.setHeader('Content-Type', 'text/csv');

    res.attachment('grade-board.csv').send(csv);
  }

  @Get(':classId/students/:studentId/grades')
  @Auth()
  async getStudentGrades(
    @Req() req: Request,
    @ParamUUIDValidation('classId', Class) classId: string,
    @ParamIdValidation('studentId', Student) studentId: string,
  ): Promise<Grade[]> {
    await this.classesService.validatePermission(req.user.id, classId);

    return this.classesService.getStudentGrades(
      req.user.id,
      classId,
      studentId,
    );
  }

  @Patch(':classId/students/:studentId')
  @Auth()
  async updateStudent(
    @Req() req: Request,
    @ParamUUIDValidation('classId', Class) classId: string,
    @ParamIdValidation('studentId', Student) studentId: string,
    @Body() body: UpdateStudentDto,
  ): Promise<void> {
    await this.classesService.validatePermission(req.user.id, classId, {
      role: EClassRole.TEACHER,
      onlyOwner: true,
    });

    await this.classesService.updateStudent(classId, studentId, body);
  }

  @Delete(':classId/students/:studentId')
  @Auth()
  async deleteStudent(
    @Req() req: Request,
    @ParamUUIDValidation('classId', Class) classId: string,
    @ParamIdValidation('studentId', Student) studentId: string,
  ): Promise<void> {
    await this.classesService.validatePermission(req.user.id, classId, {
      role: EClassRole.TEACHER,
      onlyOwner: true,
    });

    await this.classesService.deleteStudent(classId, studentId);
  }

  @Delete(':classId/students')
  @Auth()
  async clearStudentList(
    @Req() req: Request,
    @ParamUUIDValidation('classId', Class) classId: string,
  ): Promise<void> {
    await this.classesService.validatePermission(req.user.id, classId, {
      role: EClassRole.TEACHER,
      onlyOwner: true,
    });

    await this.classesService.clearStudentList(classId);
  }

  @Get(':classId/reviews')
  @Auth()
  async getReviews(
    @Req() req: Request,
    @ParamUUIDValidation('classId', Class) classId: string,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Review>> {
    await this.classesService.validatePermission(req.user.id, classId, {
      role: EClassRole.TEACHER,
    });

    return this.reviewsService.findAllWithPaginate(query);
  }
}
