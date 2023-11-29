import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SeedsModule } from './seeds.module';

const seeds = async () => {
  const seeder = await NestFactory.create(SeedsModule);

  Logger.log('Seeding started...', 'Seeds');

  await seeder.close();

  Logger.log('Seeding completed!', 'Seeds');
};

seeds();
