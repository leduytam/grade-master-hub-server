import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IsExists } from 'src/common/validators/is-exists.validator';
import { UsersModule } from '../users/users.module';
import { ClassesController } from './classes.controller';
import { ClassesService } from './classes.service';
import { CompositionsController } from './compositions.controller';
import { CompositionsService } from './compositions.service';
import { Attendance } from './entities/attendance.entity';
import { Class } from './entities/class.entity';
import { Composition } from './entities/composition.entity';
import { Grade } from './entities/grade.entity';
import { Invitation } from './entities/invitation.entity';
import { Student } from './entities/student.entity';

@Module({
  controllers: [ClassesController, CompositionsController],
  providers: [ClassesService, CompositionsService, IsExists],
  imports: [
    TypeOrmModule.forFeature([
      Class,
      Student,
      Invitation,
      Attendance,
      Composition,
      Grade,
    ]),
    forwardRef(() => UsersModule),
  ],
  exports: [ClassesService, CompositionsService],
})
export class ClassesModule {}
