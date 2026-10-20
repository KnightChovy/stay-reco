import { Injectable, Logger } from '@nestjs/common';
import { Prisma, UserRole } from '../../generated/prisma/client';
import { RequestMeta } from '../../common/decorators/request-meta.decorator';
import { PrismaService } from '../../prisma/prisma.service';

export enum AuditAction {
  ACCOUNT_REGISTERED = 'ACCOUNT_REGISTERED',
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
  ROOM_LOCKED = 'ROOM_LOCKED',
  ROOM_UNLOCKED = 'ROOM_UNLOCKED',
  STAFF_PERMISSIONS_CHANGED = 'STAFF_PERMISSIONS_CHANGED',
  STAFF_DEACTIVATED = 'STAFF_DEACTIVATED',
  STAFF_ACTIVATED = 'STAFF_ACTIVATED',
  STAFF_INVITATION_CANCELLED = 'STAFF_INVITATION_CANCELLED',
}

/** audit_log has one actor column per role; the account id is the role row's id. */
const ACTOR_COLUMN = {
  CUSTOMER: 'customerId',
  HOTEL_STAFF: 'hotelStaffId',
  HOTEL_PARTNER: 'hotelPartnerId',
  ADMIN: 'adminId',
  PLATFORM_MANAGER: 'platformManagerId',
} as const satisfies Record<
  UserRole,
  keyof Prisma.AuditLogUncheckedCreateInput
>;

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Never throws: an audit failure must not break the request.
   * `accountId` is null for events without a known actor (e.g. a failed login with an unknown email).
   */
  async log(
    action: AuditAction,
    accountId: string | null,
    meta: RequestMeta = {},
    metadata?: Prisma.InputJsonValue,
  ): Promise<void> {
    try {
      const actor = accountId
        ? await this.prisma.userAccount.findUnique({
            where: { userAccountId: accountId },
            select: { role: true },
          })
        : null;

      await this.prisma.auditLog.create({
        data: {
          action,
          ...(actor && { [ACTOR_COLUMN[actor.role]]: accountId }),
          entityType: accountId ? 'user_account' : null,
          entityId: accountId,
          newValue: metadata === undefined ? null : JSON.stringify(metadata),
          ipAddress: meta.ip,
        },
      });
    } catch (err) {
      this.logger.error(`Failed to write audit log ${action}`, err);
    }
  }
}
