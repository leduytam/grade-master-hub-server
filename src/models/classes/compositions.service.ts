import {
  BadRequestException,
  HttpException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CsvError, parse } from 'csv-parse/sync';
import {
  DeleteResult,
  FindManyOptions,
  FindOneOptions,
  MoreThan,
  Repository,
  UpdateResult,
} from 'typeorm';
import { ClassesService } from './classes.service';
import { MAX_GRADE } from './constants';
import { CreateCompositionDto } from './dto/compositions/create-composition.dto';
import { UpdateCompositionDto } from './dto/compositions/update-composition.dto';
import { Composition } from './entities/composition.entity';
import { Grade } from './entities/grade.entity';
import { Student } from './entities/student.entity';
import { EClassRole } from './types/class-roles.enum';

@Injectable()
export class CompositionsService {
  constructor(
    @InjectRepository(Composition)
    private readonly repo: Repository<Composition>,
    @InjectRepository(Grade)
    private readonly gradeRepo: Repository<Grade>,
    private readonly classesService: ClassesService,
  ) {}

  async create(
    createCompositionDto: CreateCompositionDto,
    classId: string,
  ): Promise<Composition> {
    const { count, totalPercentage } = await this.repo
      .createQueryBuilder('composition')
      .select('COUNT(composition.id)', 'count')
      .addSelect('SUM(composition.percentage)', 'totalPercentage')
      .where('composition.classEntity.id = :classId', { classId })
      .getRawOne();

    if (Number(totalPercentage) + createCompositionDto.percentage > MAX_GRADE) {
      throw new BadRequestException(
        `Total percentage of compositions cannot exceed ${MAX_GRADE}`,
      );
    }

    try {
      return await this.repo.manager.transaction(async (manager) => {
        const newComposition = this.repo.create({
          ...createCompositionDto,
          classEntity: {
            id: classId,
          },
          order: Number(count) + 1,
        });

        const savedComposition = await manager.save(newComposition);

        const students = await manager.find(Student, {
          where: {
            classEntity: {
              id: classId,
            },
          },
        });

        const newGrades = students.map((student) => {
          return this.gradeRepo.create({
            student: {
              id: student.id,
            },
            composition: {
              id: savedComposition.id,
            },
          });
        });

        await manager
          .createQueryBuilder()
          .insert()
          .into(Grade)
          .values(newGrades)
          .execute();

        return savedComposition;
      });
    } catch (err) {
      Logger.error(err);
      throw err;
    }
  }

  async findOne(options: FindOneOptions<Composition>): Promise<Composition> {
    return this.repo.findOne(options);
  }

  async findOneOrFail(
    options: FindOneOptions<Composition>,
  ): Promise<Composition> {
    return this.repo.findOneOrFail(options);
  }

  async findAll(
    options?: FindManyOptions<Composition>,
  ): Promise<Composition[]> {
    return this.repo.find(options);
  }

  async update(
    id: string,
    updateCompositionDto: UpdateCompositionDto,
  ): Promise<Composition> {
    const composition = await this.findOne({
      where: {
        id,
      },
      relations: ['classEntity'],
    });

    const classId = composition.classEntity.id;

    if (updateCompositionDto.percentage) {
      const { totalPercentage } = await this.repo
        .createQueryBuilder('composition')
        .select('SUM(composition.percentage)', 'totalPercentage')
        .where('composition.classEntity.id = :classId', { classId })
        .getRawOne();

      if (
        Number(totalPercentage) -
          composition.percentage +
          updateCompositionDto.percentage >
        MAX_GRADE
      ) {
        throw new BadRequestException(
          `Total percentage of compositions cannot exceed ${MAX_GRADE}`,
        );
      }
    }

    Object.assign(composition, updateCompositionDto);

    await this.repo.save(composition);

    delete composition.classEntity;

    return composition;
  }

  async validatePermission(
    userId: string,
    compositionId: string,
    options?: {
      role?: EClassRole;
      allowAdmin?: boolean;
      onlyOwner?: boolean;
    },
  ): Promise<void> {
    const composition = await this.findOne({
      where: {
        id: compositionId,
      },
      relations: ['classEntity'],
    });

    await this.classesService.validatePermission(
      userId,
      composition.classEntity.id,
      options,
    );
  }

  async finalize(id: string): Promise<void> {
    const composition = await this.findOne({
      where: {
        id,
      },
      relations: ['classEntity'],
    });

    if (composition.finalized) {
      throw new BadRequestException('This composition is already finalized');
    }

    const grades = await this.gradeRepo.find({
      where: {
        composition: {
          id,
        },
      },
    });

    if (grades.some((grade) => grade.grade === null)) {
      throw new BadRequestException('Some grades are not yet filled!');
    }

    await this.repo.update(id, {
      finalized: true,
    });

    // TODO: notify all accounts that mapped to students in this class
  }

  async updateOrder(id: string, order: number): Promise<void> {
    await this.repo.manager.transaction(async (manager) => {
      try {
        const composition = await manager.findOne(Composition, {
          where: { id },
          relations: ['classEntity'],
        });

        if (!composition) {
          throw new BadRequestException('Composition not found');
        }

        const sortedCompositions = await manager.find(Composition, {
          where: { classEntity: { id: composition.classEntity.id } },
          order: { order: 'ASC' },
        });

        if (!(order >= 1 && order <= sortedCompositions.length)) {
          throw new BadRequestException('Invalid order');
        }

        const oldOrder = composition.order;
        const newOrder = order;

        if (oldOrder === newOrder) {
          return;
        }

        const promises: Promise<any>[] = [];

        if (oldOrder < newOrder) {
          const compositions = sortedCompositions.slice(oldOrder, newOrder);

          promises.push(
            ...compositions.map((composition) => {
              return manager.update(Composition, composition.id, {
                order: composition.order - 1,
              });
            }),
          );
        } else {
          const compositions = sortedCompositions.slice(
            newOrder - 1,
            oldOrder - 1,
          );

          promises.push(
            ...compositions.map((composition) => {
              return manager.update(Composition, composition.id, {
                order: composition.order + 1,
              });
            }),
          );
        }

        promises.push(
          manager.update(Composition, id, {
            order: newOrder,
          }),
        );

        await Promise.all(promises);
      } catch (err) {
        if (!(err instanceof HttpException)) {
          Logger.error(err);
        }

        throw err;
      }
    });
  }

  async delete(id: string): Promise<DeleteResult> {
    return await this.repo.manager.transaction(async (manager) => {
      const compositionToDelete = await manager.findOne(Composition, {
        where: { id },
        relations: ['classEntity'],
      });

      const compositions = await manager.find(Composition, {
        where: {
          classEntity: { id: compositionToDelete.classEntity.id },
          order: MoreThan(compositionToDelete.order),
        },
        order: { order: 'ASC' },
      });

      const updatePromises = compositions.map((composition) =>
        manager.update(Composition, composition.id, {
          order: composition.order - 1,
        }),
      );

      await Promise.all(updatePromises);

      return manager.delete(Composition, id);
    });
  }

  async uploadStudentGrades(
    compositionId: string,
    file: Express.Multer.File,
  ): Promise<UpdateResult[]> {
    const composition = await this.findOne({
      where: {
        id: compositionId,
      },
    });

    if (composition.finalized) {
      throw new BadRequestException(
        'Cannot upload grades of a finalized composition',
      );
    }

    const csvData = file.buffer.toString('utf-8');

    try {
      const records: { student_id: string; grade: string }[] = parse(csvData, {
        skipEmptyLines: true,
        fromLine: 2,
        columns: ['student_id', 'grade'],
      });

      const grades = await this.gradeRepo.find({
        where: {
          composition: {
            id: compositionId,
          },
        },
        relations: ['student'],
      });

      const studentIdsMap = new Map<string, boolean>();

      grades.forEach((grade) => {
        studentIdsMap.set(grade.student.id, true);
      });

      // uncomment if you want to check if number of records matches number of students
      // if (grades.length !== records.length) {
      //   throw new BadRequestException(
      //     'Number of records does not match number of students',
      //   );
      // }

      records.forEach((record) => {
        if (
          Number.isNaN(parseInt(record.grade)) ||
          !Number.isInteger(+record.grade)
        ) {
          throw new BadRequestException(`Grade must be an integer`);
        }

        if (!studentIdsMap.has(record.student_id)) {
          throw new BadRequestException(
            `Student with ID ${record.student_id} does not exist`,
          );
        }

        const grade = Number(record.grade);

        if (grade < 0 || grade > MAX_GRADE) {
          throw new BadRequestException(
            `Grade must be between 0 and ${MAX_GRADE}, got ${grade}`,
          );
        }
      });

      return await this.repo.manager.transaction(async (manager) => {
        const promises = records.map((record) => {
          return manager.update(
            Grade,
            {
              student: {
                id: record.student_id,
              },
              composition: {
                id: compositionId,
              },
            },
            {
              grade: +record.grade,
            },
          );
        });

        return await Promise.all(promises);
      });
    } catch (err) {
      if (err instanceof CsvError) {
        throw new BadRequestException('Invalid CSV file');
      }

      throw err;
    }
  }

  async updateStudentGrade(
    compositionId: string,
    studentId: string,
    grade: number,
  ): Promise<void> {
    const gradeEntity = await this.gradeRepo.findOne({
      where: {
        composition: {
          id: compositionId,
        },
        student: {
          id: studentId,
        },
      },
      relations: ['composition', 'student'],
    });

    if (gradeEntity.composition.finalized) {
      throw new BadRequestException(
        'Cannot update grade of a finalized composition',
      );
    }

    await this.gradeRepo.update(gradeEntity.id, {
      grade,
    });
  }
}
