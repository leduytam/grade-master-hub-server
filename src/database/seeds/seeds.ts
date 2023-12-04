import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SeedsModule } from './seeds.module';
import { UsersSeedService } from './users/users.service';
import { VerificationTokenTypesSeedService } from './verification-token-types/verification-token-types.service';

const seeds = async () => {
  const seeder = await NestFactory.create(SeedsModule);

  Logger.log('Seeding started...', 'Seeds');

  await seeder.get(VerificationTokenTypesSeedService).run();
  await seeder.get(UsersSeedService).run();

  await seeder.close();

  Logger.log('Seeding completed!', 'Seeds');
};

seeds();
