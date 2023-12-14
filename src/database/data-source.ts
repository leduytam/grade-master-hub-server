import dotenvFlow from 'dotenv-flow';
import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

dotenvFlow.config();

export const appDataSource = new DataSource({
  type: process.env.DB_TYPE || 'postgres',
  url: process.env.DB_URL,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT ? +process.env.DB_PORT : 5432,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize:
    process.env.DB_SYNCHRONIZE === undefined
      ? process.env.NODE_ENV !== 'production'
      : process.env.DB_SYNCHRONIZE === 'true',
  migrationsRun:
    process.env.DB_MIGRATIONS_RUN === undefined
      ? process.env.NODE_ENV === 'production'
      : process.env.DB_MIGRATIONS_RUN === 'true',
  dropSchema: false,
  logging: process.env.NODE_ENV !== 'production',
  timezone: process.env.DB_TIMEZONE || 'UTC',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  cli: {
    entitiesDir: 'src',
    migrationsDir: 'src/database/migrations',
  },
  extra: {
    ssl:
      process.env.DB_SSL_ENABLED === 'true'
        ? {
            rejectUnauthorized: process.env.DB_REJECT_UNAUTHORIZED === 'true',
            ca: process.env.DB_CA,
            key: process.env.DB_KEY,
            cert: process.env.DB_CERT,
          }
        : undefined,
  },
  namingStrategy: new SnakeNamingStrategy(),
} as DataSourceOptions);
