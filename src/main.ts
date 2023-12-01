import {
  ClassSerializerInterceptor,
  Logger,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { useContainer } from 'class-validator';
import compression from 'compression';
import helmet from 'helmet';
import morgan from 'morgan';
import { AppModule } from './app.module';
import { IAllConfig } from './configs/types/config.interface';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });
  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  const configService = app.get(ConfigService<IAllConfig>);

  const logger = new Logger('HTTP');
  app.use(
    morgan('tiny', {
      stream: {
        write: (message: string) => logger.log(message.replace('\n', '')),
      },
    }),
  );

  app.enableCors();
  app.enableShutdownHooks();

  app.use(helmet());
  app.use(compression());
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    }),
  );

  app.enableVersioning({
    type: VersioningType.URI,
  });

  app.setGlobalPrefix(configService.get('app.apiPrefix', { infer: true }), {
    exclude: [],
  });

  SwaggerModule.setup(
    `${configService.get('app.apiPrefix', { infer: true })}/docs`,
    app,
    SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('OpenAPI Documentation')
        .setDescription('API Documents for the project')
        .setVersion('1.0')
        .addBearerAuth()
        .build(),
    ),
  );

  await app.listen(configService.get('app.port', { infer: true }));

  return app.getUrl();
}

void (async (): Promise<void> => {
  try {
    const url = await bootstrap();
    Logger.log(url, 'Bootstrap');
  } catch (error) {
    Logger.error(error, 'Bootstrap');
  }
})();
