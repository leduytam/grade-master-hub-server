import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CsvError, parse } from 'csv-parse/sync';
import ms from 'ms';
import {
  FilterOperator,
  FilterSuffix,
  PaginateQuery,
  Paginated,
  paginate,
} from 'nestjs-paginate';
import { randomAsciiString } from 'src/utils/randomString';
import {
  DeleteResult,
  FindManyOptions,
  FindOneOptions,
  Repository,
  UpdateResult,
} from 'typeorm';
import { User } from '../users/entities/user.entity';
import { EUserRole } from '../users/types/user-roles.enum';
import { UsersService } from '../users/users.service';
import { ClassInviteDto } from './dto/classes/class-invite.dto';
import { CreateClassAsAdminDto } from './dto/classes/create-class-as-admin.dto';
import { CreateClassDto } from './dto/classes/create-class.dto';
import { CreateInviteTokenDto } from './dto/classes/create-invite-token.dto';
import { MapStudentIdDto } from './dto/classes/map-student-id.dto';
import { UnmapStudentIdDto } from './dto/classes/unmap-student-id.dto';
import { UpdateClassDto } from './dto/classes/update-class.dto';
import { UpdateStudentDto } from './dto/classes/update-student.dto';
import { Attendance } from './entities/attendance.entity';
import { Class } from './entities/class.entity';
import { Grade } from './entities/grade.entity';
import { Invitation } from './entities/invitation.entity';
import { Student } from './entities/student.entity';
import { EClassRole } from './types/class-roles.enum';
import { IGradeBoard } from './types/grade-board.interface';

@Injectable()
export class ClassesService {
  constructor(
    @InjectRepository(Class)
    private readonly repo: Repository<Class>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    @InjectRepository(Invitation)
    private readonly invitationRepo: Repository<Invitation>,
    @InjectRepository(Attendance)
    private readonly attendanceRepo: Repository<Attendance>,
    @InjectRepository(Grade)
    private readonly gradeRepo: Repository<Grade>,
    private readonly usersService: UsersService,
  ) {}

  async create(userId: string, createClassDto: CreateClassDto): Promise<Class> {
    let code: string;

    do {
      code = randomAsciiString(6);
    } while (
      await this.repo.findOne({
        where: {
          code,
        },
      })
    );

    const classEntity = this.repo.save({
      ...createClassDto,
      code,
      owner: {
        id: userId,
      } as User,
    });

    const attendance = this.attendanceRepo.create({
      role: EClassRole.TEACHER,
      classEntity: {
        id: (await classEntity).id,
      } as Class,
      user: {
        id: userId,
      } as User,
    });

    await this.attendanceRepo.save(attendance);

    return classEntity;
  }

  async createAsAdmin(dto: CreateClassAsAdminDto): Promise<Class> {
    const user = await this.usersService.findOne({
      where: {
        id: dto.teacherId,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === EUserRole.ADMIN) {
      throw new ForbiddenException('Admins cannot create classes');
    }

    return this.create(user.id, {
      name: dto.name,
      description: dto.description,
    } as CreateClassDto);
  }

  async findOne(options: FindOneOptions<Class>): Promise<Class> {
    return this.repo.findOne(options);
  }

  async find(options: FindManyOptions<Class>): Promise<Class[]> {
    return this.repo.find(options);
  }

  async update(classId: string, body: UpdateClassDto): Promise<void> {
    await this.repo.update(
      {
        id: classId,
      },
      body,
    );
  }

  async getClassDetail(
    classId: string,
    options: { withDeleted?: boolean } = {},
  ) {
    const query = this.repo
      .createQueryBuilder('class')
      .where('class.id = :classId', {
        classId,
      })
      .leftJoinAndSelect('class.owner', 'owner')
      .leftJoinAndSelect('owner.avatar', 'avatar')
      .leftJoin('class.students', 'students')
      .addSelect(['students.id', 'students.name'])
      .leftJoin('class.attendances', 'attendances')
      .leftJoinAndSelect('attendances.user', 'user')
      .leftJoinAndSelect('user.avatar', 'userAvatar')
      .addSelect(['attendances.role']);

    if (options.withDeleted) {
      query.withDeleted();
    }

    return query.getOne();
  }

  async findOneWithRole(
    userId: string,
    classId: string,
  ): Promise<Class & { role: string }> {
    const classEntity = await this.findOne({
      where: {
        id: classId,
      },
      relations: ['owner'],
    });

    const userAttendance = await this.attendanceRepo.findOne({
      where: {
        classEntity: {
          id: classId,
        },
        user: {
          id: userId,
        },
      },
    });

    return {
      ...classEntity,
      role: userAttendance.role,
    };
  }

  async findAllWithPaginate(query: PaginateQuery) {
    return paginate(query, this.repo, {
      relations: {
        owner: true,
      },
      sortableColumns: ['id', 'name', 'createdAt'],
      searchableColumns: ['name', 'owner.firstName', 'owner.lastName'],
      defaultSortBy: [['createdAt', 'DESC']],
      filterableColumns: {
        active: [FilterOperator.EQ, FilterSuffix.NOT],
      },
      withDeleted: true,
    });
  }

  async findOwnedClasses(ownerId: string, query: PaginateQuery) {
    return paginate(query, this.repo, {
      relations: ['owner', 'owner.avatar'],
      sortableColumns: ['createdAt', 'updatedAt'],
      defaultSortBy: [['updatedAt', 'DESC']],
      where: {
        owner: {
          id: ownerId,
        },
      },
    });
  }

  async findJoinedClasses(
    userId: string,
    query: PaginateQuery,
    role: EClassRole = EClassRole.STUDENT,
  ) {
    const qb = this.repo
      .createQueryBuilder('class')
      .leftJoinAndSelect('class.owner', 'owner')
      .leftJoinAndSelect('owner.avatar', 'avatar')
      .where(
        `class.id IN (select "class_entity_id" from attendances where "user_id" = :userId and "role" = '${role}')`,
        {
          userId,
        },
      );

    return paginate(query, qb, {
      sortableColumns: ['createdAt', 'updatedAt'],
      defaultSortBy: [['updatedAt', 'DESC']],
    });
  }

  async softDelete(classId: string): Promise<DeleteResult> {
    return await this.repo.softDelete({
      id: classId,
    });
  }

  async restore(classId: string): Promise<UpdateResult> {
    return this.repo.restore({
      id: classId,
    });
  }

  // TODO: validate file more strictly
  async uploadStudentList(
    classId: string,
    file: Express.Multer.File,
  ): Promise<Student[]> {
    const countStudents = await this.studentRepo.count({
      where: {
        classEntity: {
          id: classId,
        },
      },
    });

    if (countStudents > 0) {
      throw new BadRequestException('Class already has students');
    }

    const csvData = file.buffer.toString('utf-8');

    try {
      const records: { student_id: string; student_name: string }[] = parse(
        csvData,
        {
          skipEmptyLines: true,
          fromLine: 2,
          columns: ['student_id', 'student_name'],
        },
      );

      const students: Student[] = records.map((record) => {
        return this.studentRepo.create({
          id: record.student_id,
          name: record.student_name,
          classEntity: {
            id: classId,
          },
        });
      });

      // Add grades for each student for each composition
      const classEntity = await this.repo.findOne({
        where: {
          id: classId,
        },
        relations: ['compositions'],
      });

      const grades = classEntity.compositions.flatMap((composition) => {
        return students.map((student) => {
          return this.gradeRepo.create({
            composition: {
              id: composition.id,
            },
            student: {
              id: student.id,
            },
          });
        });
      });

      // transactions for students and grades
      await this.studentRepo.manager.transaction(async (manager) => {
        await manager.save(students);
        await manager.save(grades);
      });

      return students;
    } catch (error) {
      if (error instanceof CsvError) {
        throw new BadRequestException('Invalid CSV file');
      }

      throw error;
    }
  }

  async createInviteToken(
    classId: string,
    body: CreateInviteTokenDto,
  ): Promise<{ token: string }> {
    const { role, expiresIn } = body;

    const invitationEntity = this.invitationRepo.create({
      role,
      classEntity: {
        id: classId,
      },
      token: randomAsciiString(32),
      expiredAt: new Date(Date.now() + ms(expiresIn)),
    });

    await this.invitationRepo.save(invitationEntity);

    return {
      token: invitationEntity.token,
    };
  }

  async inviteByEmail(classId: string, body: ClassInviteDto): Promise<void> {
    const { email, role } = body;

    const user = await this.usersService.findOne({
      where: {
        email,
      },
    });

    if (!user || user.role === EUserRole.ADMIN) {
      throw new BadRequestException(
        'This user is not found or cannot be invited',
      );
    }

    if (
      await this.attendanceRepo.findOne({
        where: {
          classEntity: {
            id: classId,
          },
          user: {
            id: user.id,
          },
        },
      })
    ) {
      throw new ForbiddenException('This user is already in this class');
    }

    const attendance = this.attendanceRepo.create({
      role,
      classEntity: {
        id: classId,
      },
      user: {
        id: user.id,
      },
    });

    await this.attendanceRepo.save(attendance);
  }

  async joinClassWithToken(userId: string, token: string): Promise<void> {
    const invitation = await this.invitationRepo.findOne({
      where: {
        token,
      },
      relations: {
        classEntity: true,
      },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation token is invalid');
    }

    if (invitation.expiredAt < new Date()) {
      throw new BadRequestException('Invitation token has expired');
    }

    await this.joinClass(userId, invitation.classEntity.id, invitation.role);
  }

  async joinClassWithCode(userId: string, code: string): Promise<void> {
    const foundClass = await this.findOne({
      where: {
        code,
      },
    });

    if (!foundClass) {
      throw new NotFoundException('Class not found');
    }

    await this.joinClass(userId, foundClass.id, EClassRole.STUDENT);
  }

  private async joinClass(userId: string, classId: string, role: EClassRole) {
    if (
      await this.attendanceRepo.findOne({
        where: {
          classEntity: {
            id: classId,
          },
          user: {
            id: userId,
          },
        },
      })
    ) {
      throw new ForbiddenException('You are already in this class');
    }

    const attendance = this.attendanceRepo.create({
      role,
      classEntity: {
        id: classId,
      },
      user: {
        id: userId,
      },
    });

    await this.attendanceRepo.save(attendance);
  }

  async leave(userId: string, classId: string): Promise<void> {
    const classEntity = await this.findOne({
      where: {
        id: classId,
      },
      relations: ['owner'],
    });

    if (classEntity.owner.id === userId) {
      throw new BadRequestException('You cannot leave your own class');
    }

    // delete user from attendances
    await this.attendanceRepo.delete({
      classEntity: {
        id: classId,
      },
      user: {
        id: userId,
      },
    });

    // unmap student id of the user
    await this.studentRepo.update(
      {
        user: {
          id: userId,
        },
        classEntity: {
          id: classId,
        },
      },
      {
        user: null,
      },
    );
  }

  async kick(
    userId: string,
    classId: string,
    attendeeIdToKick: string,
  ): Promise<void> {
    // cannot kick self
    if (userId === attendeeIdToKick) {
      throw new BadRequestException('You cannot kick yourself');
    }

    const user = await this.usersService.findOne({
      where: {
        id: userId,
      },
    });

    const attendee = await this.usersService.findOne({
      where: {
        id: attendeeIdToKick,
      },
    });

    if (!attendee) {
      throw new NotFoundException('Attendee not found');
    }

    const classEntity = await this.findOne({
      where: {
        id: classId,
      },
      relations: ['owner'],
    });

    // cannot kick owner
    if (classEntity.owner.id === attendee.id) {
      throw new BadRequestException('You cannot kick the owner');
    }

    // teacher cannot kick teacher but owner can
    if (
      classEntity.owner.id !== user.id &&
      (await this.isJoinedAs(attendeeIdToKick, classId, EClassRole.TEACHER)) &&
      (await this.isJoinedAs(userId, classId, EClassRole.TEACHER))
    ) {
      throw new BadRequestException('Only the owner can kick teachers');
    }

    await this.leave(attendeeIdToKick, classId);
  }

  async getAttendees(
    classId: string,
    query: PaginateQuery,
  ): Promise<Paginated<Attendance>> {
    const qb = this.attendanceRepo
      .createQueryBuilder('attendance')
      .leftJoinAndSelect('attendance.user', 'user')
      .leftJoinAndSelect('user.avatar', 'avatar')
      .leftJoinAndMapOne(
        'attendance.student',
        Student,
        'student',
        'student.user = user.id',
      )
      .where('attendance.classEntity = :classId', {
        classId,
      })
      .select(['attendance', 'student.id', 'user', 'avatar']);

    return paginate(query, qb, {
      sortableColumns: ['createdAt'],
      defaultSortBy: [['createdAt', 'DESC']],
      filterableColumns: {
        role: [FilterOperator.EQ],
      },
    });
  }

  async getStudents(
    classId: string,
    query: PaginateQuery,
  ): Promise<Paginated<Student>> {
    const qb = this.studentRepo
      .createQueryBuilder('student')
      .where('student.classEntity = :classId', {
        classId,
      })
      .leftJoinAndSelect('student.user', 'user')
      .leftJoinAndSelect('user.avatar', 'avatar');

    return paginate(query, qb, {
      sortableColumns: ['id'],
      defaultSortBy: [['id', 'DESC']],
    });
  }

  async validatePermission(
    userId: string,
    classId: string,
    options?: {
      role?: EClassRole;
      allowAdmin?: boolean;
      onlyOwner?: boolean;
    },
  ): Promise<void> {
    const defaultOptions = {
      allowAdmin: true,
      onlyOwner: false,
    };

    options = {
      ...defaultOptions,
      ...options,
    };

    const foundAttendance = await this.attendanceRepo.findOne({
      where: {
        classEntity: {
          id: classId,
        },
        user: {
          id: userId,
        },
      },
      relations: ['user', 'classEntity', 'classEntity.owner'],
    });

    const user = await this.usersService.findOne({
      where: {
        id: userId,
      },
    });

    if (options?.allowAdmin && user.role === EUserRole.ADMIN) {
      return;
    }

    if (!foundAttendance) {
      throw new ForbiddenException('You are not in this class');
    }

    if (options?.role && foundAttendance.role !== options?.role) {
      throw new ForbiddenException('You are not allowed to do this action.');
    }

    if (
      options?.onlyOwner &&
      foundAttendance.user.id === foundAttendance.classEntity.owner.id
    ) {
      return;
    }

    if (options?.onlyOwner) {
      throw new ForbiddenException(
        'You are not allowed to do this action. Only the owner can do this',
      );
    }
  }

  async isJoinedAs(
    userId: string,
    classId: string,
    role?: EClassRole,
  ): Promise<boolean> {
    return !!(await this.attendanceRepo.findOne({
      where: {
        classEntity: {
          id: classId,
        },
        user: {
          id: userId,
        },
        role,
      },
    }));
  }

  async getMappedStudentId(
    userId: string,
    classId: string,
  ): Promise<{ studentId: string }> {
    const student = await this.studentRepo.findOne({
      where: {
        user: {
          id: userId,
        },
        classEntity: {
          id: classId,
        },
      },
    });

    return {
      studentId: student ? student.id : null,
    };
  }

  async mapStudentId(
    userId: string,
    classId: string,
    body: MapStudentIdDto,
  ): Promise<void> {
    if (!(await this.isJoinedAs(body.userId, classId, EClassRole.STUDENT))) {
      throw new BadRequestException('Assignee is not a student of this class');
    }

    const assignorAttendance = await this.attendanceRepo.findOne({
      where: {
        classEntity: {
          id: classId,
        },
        user: {
          id: userId,
        },
      },
      relations: ['user'],
    });

    if (
      assignorAttendance &&
      assignorAttendance.role === EClassRole.STUDENT &&
      assignorAttendance.user.id !== body.userId
    ) {
      throw new BadRequestException('You cannot map student id for others');
    }

    if (
      (await this.studentRepo.count({
        where: {
          user: {
            id: body.userId,
          },
          classEntity: {
            id: classId,
          },
        },
      })) > 0
    ) {
      throw new BadRequestException('Assignee is already mapped');
    }

    const student = await this.studentRepo.findOne({
      where: {
        id: body.studentId,
        classEntity: {
          id: classId,
        },
      },
      relations: ['user'],
    });

    if (!student) {
      throw new NotFoundException('Student id not found in this class');
    }

    if (student.user) {
      throw new BadRequestException('Student id already mapped');
    }

    await this.studentRepo.update(
      {
        id: body.studentId,
      },
      {
        user: {
          id: body.userId,
        },
      },
    );
  }

  async unmapStudentId(
    userId: string,
    classId: string,
    body: UnmapStudentIdDto,
  ): Promise<void> {
    const assignorAttendance = await this.attendanceRepo.findOne({
      where: {
        classEntity: {
          id: classId,
        },
        user: {
          id: userId,
        },
      },
      relations: ['user'],
    });

    if (
      assignorAttendance &&
      assignorAttendance.role === EClassRole.STUDENT &&
      assignorAttendance.user.id !== body.userId
    ) {
      throw new BadRequestException('You cannot map student id for others');
    }

    const student = await this.studentRepo.findOne({
      where: {
        classEntity: {
          id: classId,
        },
        user: {
          id: body.userId,
        },
      },
    });

    if (student) {
      await this.studentRepo.update(
        {
          id: student.id,
        },
        {
          user: null,
        },
      );
    } else {
      throw new NotFoundException('This student is not mapped');
    }
  }

  async getGradeBoard(classId: string): Promise<IGradeBoard> {
    const classEntity = await this.findOne({
      where: {
        id: classId,
      },
      relations: [
        'compositions',
        'compositions.grades',
        'compositions.grades.student',
      ],
      order: {
        compositions: {
          order: 'ASC',
        },
      },
    });

    const header = {
      student: {
        id: 'Student ID',
        name: 'Student Name',
      },
      compositions: classEntity.compositions.map((composition) => {
        return {
          id: composition.id,
          name: composition.name,
          percentage: composition.percentage,
          finalized: composition.finalized,
          order: composition.order,
        };
      }),
      total: 'Total',
    };

    const studentMaps = new Map<
      string,
      {
        id: string;
        name: string;
        compositions: {
          id: string;
          grade: number | null;
          percentage: number;
        }[];
      }
    >();

    classEntity.compositions.forEach((composition) => {
      composition.grades.forEach((grade) => {
        if (!studentMaps.has(grade.student.id)) {
          studentMaps.set(grade.student.id, {
            id: grade.student.id,
            name: grade.student.name,
            compositions: [],
          });
        }

        studentMaps.get(grade.student.id).compositions.push({
          id: composition.id,
          grade: grade.grade,
          percentage: composition.percentage,
        });
      });
    });

    const rows = Array.from(studentMaps.values()).map((student) => {
      const total = student.compositions.reduce((acc, curr) => {
        if (curr.grade === null) {
          return acc;
        }

        return acc + (curr.grade * curr.percentage) / 100.0;
      }, 0);

      return {
        student: {
          id: student.id,
          name: student.name,
        },
        compositions: student.compositions.map((composition) => {
          return {
            id: composition.id,
            grade: composition.grade,
          };
        }),
        total: total,
      };
    });

    return {
      header,
      rows: rows,
    };
  }

  async getStudentGrades(
    userId: string,
    classId: string,
    studentId: string,
  ): Promise<Grade[]> {
    const student = await this.studentRepo.findOne({
      where: {
        id: studentId,
        classEntity: {
          id: classId,
        },
      },
      relations: ['user'],
    });

    const user = await this.usersService.findOne({
      where: {
        id: userId,
      },
    });

    const isStudent = await this.isJoinedAs(
      userId,
      classId,
      EClassRole.STUDENT,
    );

    // prevent students from viewing other student grades
    if (user.role !== EUserRole.ADMIN && isStudent) {
      if (!student.user || student.user.id !== userId) {
        throw new ForbiddenException('You cannot view other student grades');
      }
    }

    const grades = await this.gradeRepo
      .createQueryBuilder('grade')
      .leftJoinAndSelect('grade.composition', 'composition')
      .where('composition.classEntity = :classId', {
        classId,
      })
      .andWhere('grade.student = :studentId', {
        studentId,
      })
      .orderBy('composition.order', 'ASC')
      .getMany();

    // filter out grades that are not finalized yet (for students)
    return grades.map((grade) => {
      if (isStudent && !grade.composition.finalized) {
        grade.grade = null;
      }

      return grade;
    });
  }

  async updateStudent(
    classId: string,
    studentId: string,
    body: UpdateStudentDto,
  ): Promise<UpdateResult> {
    return await this.studentRepo.update(
      {
        id: studentId,
        classEntity: {
          id: classId,
        },
      },
      body,
    );
  }

  async deleteStudent(
    classId: string,
    studentId: string,
  ): Promise<DeleteResult> {
    return await this.studentRepo.delete({
      id: studentId,
      classEntity: {
        id: classId,
      },
    });
  }

  async clearStudentList(classId: string): Promise<void> {
    await this.studentRepo.delete({
      classEntity: {
        id: classId,
      },
    });
  }

  async getRoleInClass(userId: string, classId: string): Promise<EClassRole> {
    const attendance = await this.attendanceRepo.findOne({
      where: {
        classEntity: {
          id: classId,
        },
        user: {
          id: userId,
        },
      },
    });

    return attendance?.role ?? null;
  }
}
