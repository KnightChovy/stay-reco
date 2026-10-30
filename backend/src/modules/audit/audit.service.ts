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
  VERIFICATION_SUBMITTED = 'VERIFICATION_SUBMITTED',
  VERIFICATION_APPROVED = 'VERIFICATION_APPROVED',
  VERIFICATION_REJECTED = 'VERIFICATION_REJECTED',
  VERIFICATION_CHANGES_REQUESTED = 'VERIFICATION_CHANGES_REQUESTED',
  VERIFICATION_REVERIFICATION_REQUESTED = 'VERIFICATION_REVERIFICATION_REQUESTED',
  /** A customer cancelled a booking; `new_value` holds the reason, fee and refund (decision P11). */
  BOOKING_CANCEL_REQUESTED = 'BOOKING_CANCEL_REQUESTED',
  /** Hotel staff with REFUND checked a refund request and passed it to the partner with a note. */
  REFUND_FORWARDED = 'REFUND_FORWARDED',
  REFUND_APPROVED = 'REFUND_APPROVED',
  REFUND_REJECTED = 'REFUND_REJECTED',
  /** Approved by the system at the check-in time, for a request made before it (decision P11). */
  REFUND_AUTO_APPROVED = 'REFUND_AUTO_APPROVED',
  /** SePay reported the payment and the booking was confirmed; `new_value` holds the transaction id and amount (O15). */
  BOOKING_CONFIRMED = 'BOOKING_CONFIRMED',
  /** The 15-minute hold ran out unpaid (O15). */
  BOOKING_EXPIRED = 'BOOKING_EXPIRED',
  /** Staff checked the guest in; `new_value` holds the assigned rooms (decision O3). */
  BOOKING_CHECKED_IN = 'BOOKING_CHECKED_IN',
  /** Staff checked the guest out; `new_value` holds the commission and the nights released early (decisions O6, O9). */
  BOOKING_CHECKED_OUT = 'BOOKING_CHECKED_OUT',
  /** The guest never arrived, marked by staff or by the system at the check-out time (decisions O4, O5). */
  BOOKING_NO_SHOW = 'BOOKING_NO_SHOW',
  /** The customer asked to change guest details; `new_value` holds the changed fields (UC25, decision O11). */
  BOOKING_CHANGE_REQUESTED = 'BOOKING_CHANGE_REQUESTED',
  /** The hotel applied the requested changes to the booking (UC43). */
  BOOKING_CHANGE_ACCEPTED = 'BOOKING_CHANGE_ACCEPTED',
  /** The hotel kept the booking as it was; `new_value` holds the reason sent to the customer (UC43). */
  BOOKING_CHANGE_REJECTED = 'BOOKING_CHANGE_REJECTED',
  /** A SePay transfer that confirmed nothing (no or unknown code, wrong amount, other account): for manual handling. */
  SEPAY_TRANSFER_UNMATCHED = 'SEPAY_TRANSFER_UNMATCHED',
  /** A SePay transfer for a booking no longer waiting for payment (expired, already paid): refund by hand. */
  SEPAY_TRANSFER_LATE = 'SEPAY_TRANSFER_LATE',
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
