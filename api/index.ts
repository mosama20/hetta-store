import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import express, { Express, Request, Response } from 'express';
import { AppModule } from '../apps/api/src/app.module.js';
import { GlobalExceptionFilter } from '../apps/api/src/common/filters/http-exception.filter.js';
import { TransformInterceptor } from '../apps/api/src/common/interceptors/transform.interceptor.js';

const server: Express = express();
let isReady = false;

async function bootstrap(): Promise<Express> {
  if (!isReady) {
    const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    app.useGlobalFilters(new GlobalExceptionFilter());
    app.useGlobalInterceptors(new TransformInterceptor());
    app.enableCors({
      origin: '*',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    });
    await app.init();
    isReady = true;
  }
  return server;
}

export default async function handler(req: Request, res: Response): Promise<void> {
  await bootstrap();
  server(req, res);
}
