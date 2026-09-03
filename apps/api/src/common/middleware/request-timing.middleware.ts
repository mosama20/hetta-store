import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RequestTimingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    const shouldLog =
      process.env.LOG_REQUEST_TIMING === 'true' ||
      process.env.NODE_ENV !== 'production';

    if (!shouldLog) {
      return next();
    }

    const start = Date.now();
    const { method, originalUrl } = req;

    res.on('finish', () => {
      const duration = Date.now() - start;
      const { statusCode } = res;
      this.logger.log(`[${method}] ${originalUrl} ${statusCode} - ${duration}ms`);
    });

    next();
  }
}
