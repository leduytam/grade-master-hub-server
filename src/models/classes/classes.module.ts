import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IsExists } from 'src/common/validators/is-exists.validator';
import { NotificationsModule } from '../notifications/notifications.module';
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
import { ReviewComment } from './entities/review-comment.entity';
import { Review } from './entities/review.entity';
import { Student } from './entities/student.entity';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';

@Module({
  controllers: [ClassesController, CompositionsController, ReviewsController],
  providers: [ClassesService, CompositionsService, IsExists, ReviewsService],
  imports: [
    TypeOrmModule.forFeature([
      Class,
      Student,
      Invitation,
      Attendance,
      Composition,
      Grade,
      Review,
      ReviewComment,
    ]),
    forwardRef(() => UsersModule),
    NotificationsModule,
  ],
  exports: [ClassesService, CompositionsService],
})
export class ClassesModule {}
