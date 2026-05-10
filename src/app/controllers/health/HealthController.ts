import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  getHealth(): { status: 'ok'; service: string } {
    return {
      status: 'ok',
      service: 'rituo-auth-api',
    };
  }
}
