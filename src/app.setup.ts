import {
  BadRequestException,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import type { Env } from './config/env.validation.js';

/** Shared by main.ts and the e2e tests so both run the same pipeline. */
export function configureApp(
  app: INestApplication,
  opts: { swagger?: boolean } = {},
) {
  const config = app.get<ConfigService<Env, true>>(ConfigService);

  app.use(helmet());
  app.enableCors({
    origin: config.get('CORS_ORIGIN', { infer: true }).split(','),
    credentials: true,
  });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) =>
        new BadRequestException({
          message: errors.flatMap((e) =>
            Object.values(e.constraints ?? { [e.property]: 'invalid' }).map(
              (m) => m,
            ),
          ),
        }),
    }),
  );
  app.enableShutdownHooks();

  if (opts.swagger) {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('Certification Platform API')
        .setVersion('0.1')
        .addBearerAuth()
        .build(),
    );
    SwaggerModule.setup('docs', app, document);
  }
}
