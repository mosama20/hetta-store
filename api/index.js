require('reflect-metadata');
const { NestFactory } = require('@nestjs/core');
const { ValidationPipe } = require('@nestjs/common');
const { ExpressAdapter } = require('@nestjs/platform-express');
const express = require('express');

// Import from pre-compiled dist (built by tsc with emitDecoratorMetadata support)
const { AppModule } = require('../apps/api/dist/app.module');
const {
  GlobalExceptionFilter,
} = require('../apps/api/dist/common/filters/http-exception.filter');
const {
  TransformInterceptor,
} = require('../apps/api/dist/common/interceptors/transform.interceptor');

const server = express();
let isReady = false;

async function bootstrap() {
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

module.exports = async function handler(req, res) {
  await bootstrap();
  server(req, res);
};
