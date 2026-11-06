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

  // Admin JSON feeds the SPA dashboard/lists only: always revalidate against the
  // ETag (304 when unchanged) so the browser disk cache can never serve a stale
  // body. Scoped to admin GETs — uploads keep their immutable caching below, and
  // worker/customer APIs are untouched.
  const adminApiPrefix = `/${apiPrefix}/admin`;
  app.use((req, res, next) => {
    if (
      req.method === 'GET' &&
      (req.path === adminApiPrefix || req.path.startsWith(`${adminApiPrefix}/`))
    ) {
      res.setHeader('Cache-Control', 'no-cache');
    }
    next();
  });

  // Increase body size limits for file uploads (multipart)
  const express = require('express');
  const path = require('path');
  // Upload keys are uuid-based, so objects are immutable: let browsers cache them
  // instead of re-validating every avatar/thumbnail on each render.
  app.use(
    '/uploads',
    (req: any, res: any, next: any) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      next();
    },
    express.static(path.join(process.cwd(), 'uploads'), {
      maxAge: '30d',
      immutable: true,
      setHeaders: (res: any) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      },
    }),
    (req: any, res: any) => {
      res.status(404).end();
    },
  );
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  app.useGlobalPipes(new AppValidationPipe());
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new PerformanceInterceptor(), new TransformInterceptor());

  await app.listen(port);
  logger.log(`HUNAR backend listening on http://localhost:${port}/${apiPrefix}`);
}

process.on('unhandledRejection', (reason) => { console.warn('[UnhandledRejection]', reason); });
process.on('uncaughtException', (err) => { console.error('[UncaughtException]', err); });

bootstrap();
