import { Controller, Get } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { Public } from './common/decorators/public.decorator';

/** Liveness probe for hosting and uptime monitors; infrastructure only, so it is kept out of the API docs. */
@ApiExcludeController()
@Controller()
export class AppController {
  @Public()
  @Get('health')
  health() {
    return { status: 'ok' };
  }
}
