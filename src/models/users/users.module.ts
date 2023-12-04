import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IsExist } from 'src/common/validators/is-exists.validator';
import { IsNotExist } from 'src/common/validators/is-not-exists.validator';
import { FilesModule } from '../files/files.module';
import { User } from './entities/user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, IsExist, IsNotExist],
  imports: [TypeOrmModule.forFeature([User]), ConfigModule, FilesModule],
  exports: [UsersService],
})
export class UsersModule {}
