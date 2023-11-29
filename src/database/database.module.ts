import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { IAllConfig } from 'src/configs/types/config.interface';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService<IAllConfig>) => {
        return {
          type: configService.get('database.type', { infer: true }),
          url: configService.get('database.url', { infer: true }),
          host: configService.get('database.host', { infer: true }),
          port: configService.get('database.port', { infer: true }),
          username: configService.get('database.username', {
            infer: true,
          }),
          password: configService.get('database.password', {
            infer: true,
          }),
          database: configService.get('database.name', { infer: true }),
          synchronize: configService.get('database.synchronize', {
            infer: true,
          }),
          dropSchema: false,
          keepConnectionAlive: true,
          migrationsRun: configService.get('database.migrationsRun', {
            infer: true,
          }),
          logging: configService.get('database.logging', { infer: true }),
          autoLoadEntities: true,
          timezone: configService.get('database.timezone', { infer: true }),
          entities: [__dirname + '/../**/*.entity{.ts,.js}'],
          migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
          cli: {
            entitiesDir: 'src',
            migrationsDir: 'src/database/migrations',
          },
          extra: {
            ssl: configService.get('database.ssl', { infer: true }),
          },
          namingStrategy: new SnakeNamingStrategy(),
        } as TypeOrmModuleOptions;
      },
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
