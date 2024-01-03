import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  ParseFilePipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { Auth } from 'src/common/decorators/auth.decorator';
import { ParamIdValidation } from 'src/common/decorators/param-id-validation.decorator';
import { ParamUUIDValidation } from 'src/common/decorators/param-uuid-validation.decorator';
import { EUserRole } from '../users/types/user-roles.enum';
import { ClassesService } from './classes.service';
import { CompositionsService } from './compositions.service';
import { CreateCompositionDto } from './dto/compositions/create-composition.dto';
import { UpdateCompositionOrderDto } from './dto/compositions/update-composition-order.dto';
import { UpdateCompositionDto } from './dto/compositions/update-composition.dto';
import { UpdateStudentGradeDto } from './dto/compositions/update-student-grade.dto';
import { Composition } from './entities/composition.entity';
import { Student } from './entities/student.entity';
import { EClassRole } from './types/class-roles.enum';

@ApiTags('Compositions')
@Controller({
  version: '1',
  path: 'compositions',
})
export class CompositionsController {
  constructor(
    private compositionsService: CompositionsService,
    private readonly classesService: ClassesService,
  ) {}

  @Post()
  @Auth()
  async createComposition(
    @Req() req: Request,
    @Body() body: CreateCompositionDto,
  ): Promise<Composition> {
    await this.classesService.validatePermission(req.user.id, body.classId, {
      role: EClassRole.TEACHER,
    });

    return this.compositionsService.create(body, body.classId);
  }

  @Get(':id')
  @Auth()
  async findOne(
    @Req() req: Request,
    @ParamUUIDValidation('id', Composition) id: string,
  ): Promise<Composition> {
    await this.compositionsService.validatePermission(req.user.id, id);

    return await this.compositionsService.findOne({
      where: {
        id,
      },
      relations: ['classEntity'],
    });
  }

  @Get()
  @Auth()
  async findAll(
    @Req() req: Request,
    @Query('classId', new ParseUUIDPipe({ version: '4', optional: true }))
    classId?: string,
  ): Promise<Composition[]> {
    if (classId) {
      await this.classesService.validatePermission(req.user.id, classId);

      return await this.compositionsService.findAll({
        where: {
          classEntity: {
            id: classId,
          },
        },
        order: {
          order: 'ASC',
        },
      });
    }

    if (req.user.role !== EUserRole.ADMIN) {
      throw new BadRequestException('Query classId is required for users');
    }

    return await this.compositionsService.findAll();
  }

  @Patch(':id')
  @Auth()
  async update(
    @Req() req: Request,
    @ParamUUIDValidation('id', Composition) id: string,
    @Body() updateCompositionDto: UpdateCompositionDto,
  ) {
    await this.compositionsService.validatePermission(req.user.id, id, {
      role: EClassRole.TEACHER,
    });

    await this.compositionsService.update(id, updateCompositionDto);
  }

  @Patch(':id/order')
  @Auth()
  async updateOrder(
    @Req() req: Request,
    @ParamUUIDValidation('id', Composition) id: string,
    @Body() body: UpdateCompositionOrderDto,
  ) {
    await this.compositionsService.validatePermission(req.user.id, id, {
      role: EClassRole.TEACHER,
    });

    return await this.compositionsService.updateOrder(id, body.order);
  }

  @Patch(':id/finalize')
  @Auth()
  async finalize(
    @Req() req: Request,
    @ParamUUIDValidation('id', Composition) id: string,
  ) {
    await this.compositionsService.validatePermission(req.user.id, id, {
      role: EClassRole.TEACHER,
    });

    return await this.compositionsService.finalize(req.user.id, id);
  }

  @Delete(':id')
  @Auth()
  async delete(
    @Req() req: Request,
    @ParamUUIDValidation('id', Composition) id: string,
  ): Promise<void> {
    await this.compositionsService.validatePermission(req.user.id, id, {
      role: EClassRole.TEACHER,
    });

    await this.compositionsService.delete(id);
  }

  @Patch(':id/grades/upload')
  @Auth()
  @UseInterceptors(FileInterceptor('file'))
  async uploadStudentGrades(
    @Req() req: Request,
    @ParamUUIDValidation('id', Composition) id: string,
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
  ): Promise<void> {
    await this.compositionsService.validatePermission(req.user.id, id, {
      role: EClassRole.TEACHER,
    });

    await this.compositionsService.uploadStudentGrades(id, file);
  }

  @Patch(':compositionId/students/:studentId/grade')
  @Auth()
  async updateStudentGrade(
    @Req() req: Request,
    @ParamUUIDValidation('compositionId', Composition) compositionId: string,
    @ParamIdValidation('studentId', Student) studentId: string,
    @Body() body: UpdateStudentGradeDto,
  ): Promise<void> {
    await this.compositionsService.validatePermission(
      req.user.id,
      compositionId,
      {
        role: EClassRole.TEACHER,
      },
    );

    await this.compositionsService.updateStudentGrade(
      compositionId,
      studentId,
      body.grade,
    );
  }
}
