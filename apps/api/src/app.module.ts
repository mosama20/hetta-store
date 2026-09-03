import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validate } from './config/env.validation';
import { PrismaModule } from './prisma/prisma.module';
import { CacheModule } from './common/cache/cache.module';
import { RequestTimingMiddleware } from './common/middleware/request-timing.middleware';
import { AuditModule } from './audit/audit.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CategoriesModule } from './categories/categories.module';
import { AttributesModule } from './attributes/attributes.module';
import { ProductsModule } from './products/products.module';
import { DiscountsModule } from './discounts/discounts.module';
import { OrdersModule } from './orders/orders.module';
import { CmsModule } from './cms/cms.module';
import { SettingsModule } from './settings/settings.module';
import { MediaModule } from './media/media.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { SheinModule } from './shein/shein.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    CacheModule,
    PrismaModule,
    AuditModule,
    AuthModule,
    UsersModule,
    CategoriesModule,
    AttributesModule,
    ProductsModule,
    DiscountsModule,
    OrdersModule,
    CmsModule,
    SettingsModule,
    MediaModule,
    DashboardModule,
    AnalyticsModule,
    SheinModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestTimingMiddleware).forRoutes('*');
  }
}

