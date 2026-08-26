import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

export interface ThrottleOptions {
  limit: number; // Maximum allowed requests
  ttlSeconds: number; // Time window in seconds
}

export const THROTTLE_AUTH_KEY = 'THROTTLE_AUTH_KEY';
export const ThrottleAuth = (options: ThrottleOptions = { limit: 5, ttlSeconds: 900 }) =>
  SetMetadata(THROTTLE_AUTH_KEY, options);

interface HitRecord {
  count: number;
  resetAt: number;
}

@Injectable()
export class AuthThrottlerGuard implements CanActivate {
  private readonly hits = new Map<string, HitRecord>();

  constructor(private readonly reflector: Reflector) {
    // Periodic garbage collection every 5 minutes to prevent memory leaks
    setInterval(() => {
      const now = Date.now();
      for (const [key, record] of this.hits.entries()) {
        if (record.resetAt <= now) {
          this.hits.delete(key);
        }
      }
    }, 5 * 60 * 1000).unref();
  }

  canActivate(context: ExecutionContext): boolean {
    const options = this.reflector.getAllAndOverride<ThrottleOptions>(THROTTLE_AUTH_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!options) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const ip =
      request.ip ||
      (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      request.socket.remoteAddress ||
      'unknown-ip';

    const path = request.path || request.url;
    const key = `${ip}:${path}`;
    const now = Date.now();

    const record = this.hits.get(key);

    if (!record || record.resetAt <= now) {
      this.hits.set(key, {
        count: 1,
        resetAt: now + options.ttlSeconds * 1000,
      });
      return true;
    }

    if (record.count >= options.limit) {
      const remainingSeconds = Math.ceil((record.resetAt - now) / 1000);
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `تم تجاوز الحد الأقصى للمحاولات. يرجى الانتظار ${Math.ceil(
            remainingSeconds / 60,
          )} دقيقة قبل المحاولة مرة أخرى.`,
          error: 'Too Many Requests',
          retryAfter: remainingSeconds,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    record.count += 1;
    return true;
  }
}
