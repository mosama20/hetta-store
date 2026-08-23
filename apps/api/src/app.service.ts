import { Injectable } from '@nestjs/common';
import { ApiResponse } from '@fashion-store/shared';

@Injectable()
export class AppService {
  getHealth(): ApiResponse<{ status: string; timestamp: string }> {
    return {
      success: true,
      data: {
        status: 'ok',
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    };
  }
}
