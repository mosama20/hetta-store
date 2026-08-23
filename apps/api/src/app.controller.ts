import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse as SwaggerApiResponse, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';
import { ApiResponse } from '@fashion-store/shared';

@ApiTags('system')
@Controller('health')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'API health and liveness check' })
  @SwaggerApiResponse({ status: 200, description: 'Service is operational' })
  getHealth(): ApiResponse<{ status: string; timestamp: string }> {
    return this.appService.getHealth();
  }
}
