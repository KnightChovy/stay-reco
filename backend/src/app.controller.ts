import {
  Controller,
  Get,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { Public } from './common/decorators/public.decorator';
import { ErrorCode } from './common/errors/error-code';
import { PrismaService } from './prisma/prisma.service';

/** node-postgres waits forever for an unreachable server by default, so the probe gives up on its own. */
export const HEALTH_DB_TIMEOUT_MS = 2000;

/** Health probe for hosting, Docker and uptime monitors; infrastructure only, so it is kept out of the API docs. */
@ApiExcludeController()
@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(private readonly prisma: PrismaService) {}

  /** 200 only when the database answers; otherwise 503 so the instance is taken out of rotation. */
  @Public()
  @Get('health')
  async health() {
    let timer: NodeJS.Timeout | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(
        () => reject(new Error(`no answer within ${HEALTH_DB_TIMEOUT_MS} ms`)),
        HEALTH_DB_TIMEOUT_MS,
      );
    });
    try {
      await Promise.race([this.prisma.$queryRaw`SELECT 1`, timeout]);
    } catch (err) {
      this.logger.error(
        `Health check failed: database ${(err as Error).message}`,
      );
      throw new ServiceUnavailableException({
        code: ErrorCode.SERVICE_UNAVAILABLE,
        message: 'The database is unavailable',
      });
    } finally {
      clearTimeout(timer);
    }
    return { status: 'ok' };
  }
}
