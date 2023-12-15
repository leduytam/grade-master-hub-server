import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IsExists } from 'src/common/validators/is-exists.validator';
import { IsNotExists } from 'src/common/validators/is-not-exists.validator';
import { ClassesModule } from '../classes/classes.module';
import { FilesModule } from '../files/files.module';
import { User } from './entities/user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, IsExists, IsNotExists],
  imports: [
    TypeOrmModule.forFeature([User]),
    ConfigModule,
    FilesModule,
    forwardRef(() => ClassesModule),
  ],
  exports: [UsersService],
})
export class UsersModule {}
