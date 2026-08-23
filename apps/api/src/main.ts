import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 4000);
  const corsOrigins = configService.get<string>('CORS_ORIGINS', 'http://localhost:5173');

  // 1. Graceful shutdown hooks
  app.enableShutdownHooks();

  // 2. Global Security & Optimization Middlewares
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    }),
  );
  app.use(compression());
  app.use(cookieParser());

  // 3. Global prefix
  app.setGlobalPrefix('api');

  // 4. Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // 5. Global Exception Filter & Transform Interceptor
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  // 6. CORS Configuration
  const allowedOrigins = corsOrigins.split(',').map((origin) => origin.trim());
  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        callback(new Error(`CORS origin '${origin}' is not allowed`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // 7. Swagger Documentation Setup
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Fashion Store REST API')
    .setDescription(
      'Comprehensive RESTful API for modern fashion retail platform supporting bilingual catalog, WhatsApp orders, RBAC, and CMS.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication & token management')
    .addTag('users', 'Administrative user management & RBAC')
    .addTag('categories', 'Product taxonomy & category hierarchy')
    .addTag('attributes', 'Garment colors and size dictionary')
    .addTag('products', 'Master product catalog & variants')
    .addTag('discounts', 'Promotional campaigns & discount rules')
    .addTag('orders', 'Order lifecycle & WhatsApp ordering flow')
    .addTag('cms', 'Dynamic homepage content sections')
    .addTag('settings', 'Store branding & general settings')
    .addTag('media', 'Media library & upload metadata')
    .addTag('audit', 'Audit logging & compliance')
    .addTag('system', 'Healthcheck and diagnostics')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(port);
  logger.log(`🚀 Fashion Store API running at: http://localhost:${port}/api`);
  logger.log(`📖 Swagger API Docs accessible at: http://localhost:${port}/api/docs`);
}

void bootstrap();
