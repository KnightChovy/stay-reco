import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { RequestMeta } from '../../common/decorators/request-meta.decorator';
import { PrismaService } from '../../prisma/prisma.service';

export enum AuditAction {
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILED = 'LOGIN_FAILED',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  LOGOUT = 'LOGOUT',
  LOGOUT_ALL = 'LOGOUT_ALL',
  SESSION_REVOKED = 'SESSION_REVOKED',
  REFRESH_TOKEN_REUSE = 'REFRESH_TOKEN_REUSE',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  PASSWORD_RESET = 'PASSWORD_RESET',
  EMAIL_VERIFIED = 'EMAIL_VERIFIED',
  ACCOUNT_INVITED = 'ACCOUNT_INVITED',
  INVITATION_ACCEPTED = 'INVITATION_ACCEPTED',
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Never throws: an audit failure must not break the request. */
  async log(
    action: AuditAction,
    accountId: string | null,
    meta: RequestMeta = {},
    metadata?: Prisma.InputJsonValue,
  ): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          action,
          accountId,
          ip: meta.ip,
          userAgent: meta.userAgent,
          metadata,
        },
      });
    } catch (err) {
      this.logger.error(`Failed to write audit log ${action}`, err);
    }
  }
}
