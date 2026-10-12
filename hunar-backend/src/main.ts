import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import compression from 'compression';
import { AppModule } from './app.module';
import { AppValidationPipe } from './common/pipes/validation.pipe';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { PerformanceInterceptor } from './common/interceptors/performance.interceptor';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  const config = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  const apiPrefix = config.get<string>('app.apiPrefix', 'api/v1');
  const port = config.get<number>('app.port', 3000);

  app.setGlobalPrefix(apiPrefix);
  app.enableCors({ origin: true, credentials: true });

  // gzip/deflate JSON responses (the bulk of API traffic). threshold keeps tiny
  // payloads uncompressed where the framing overhead would cost more than it saves.
  app.use(compression({ threshold: 1024 }));

  // Increase body size limits for file uploads (multipart)
  const express = require('express');
  const path = require('path');
  // Upload keys are uuid-based, so objects are immutable: let browsers cache them
  // instead of re-validating every avatar/thumbnail on each render.
  app.use(
    '/uploads',
    express.static(path.join(process.cwd(), 'uploads'), {
      maxAge: '30d',
      immutable: true,
    }),
  );
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  app.useGlobalPipes(new AppValidationPipe());
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new PerformanceInterceptor(), new TransformInterceptor());

  await app.listen(port);
  logger.log(`HUNAR backend listening on http://localhost:${port}/${apiPrefix}`);
}

bootstrap();
