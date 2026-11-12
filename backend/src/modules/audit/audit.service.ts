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
  /** The account changed its own profile or avatar; `new_value` lists the changed fields, not their values. */
  PROFILE_UPDATED = 'PROFILE_UPDATED',
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
  /** The guest wrote the review of a completed stay (BR-12). */
  REVIEW_CREATED = 'REVIEW_CREATED',
  /** The author edited their review inside the review window. */
  REVIEW_UPDATED = 'REVIEW_UPDATED',
  /** The hotel hid or showed a review; `new_value` holds the new visibility. */
  REVIEW_VISIBILITY_CHANGED = 'REVIEW_VISIBILITY_CHANGED',
  /** Someone flagged a review, or one of its photos, for a platform manager (R11). */
  REVIEW_REPORTED = 'REVIEW_REPORTED',
  /** A platform manager decided a report; `new_value` says whether the content was hidden. */
  REVIEW_REPORT_DECIDED = 'REVIEW_REPORT_DECIDED',
  /** A guest added a photo to their review. */
  REVIEW_IMAGE_ADDED = 'REVIEW_IMAGE_ADDED',
  /** A guest removed a photo from their review. */
  REVIEW_IMAGE_REMOVED = 'REVIEW_IMAGE_REMOVED',
  /** The hotel started a discount campaign (BR-06). */
  PROMOTION_CREATED = 'PROMOTION_CREATED',
  /** The hotel changed a campaign; `new_value` holds the fields that changed. */
  PROMOTION_UPDATED = 'PROMOTION_UPDATED',
  /** Personal discount codes handed to customers of a campaign. */
  VOUCHERS_ISSUED = 'VOUCHERS_ISSUED',
  /** A booking took a discount; `new_value` holds the campaign, the code and the amount taken off. */
  BOOKING_DISCOUNT_APPLIED = 'BOOKING_DISCOUNT_APPLIED',
  /** The AI wrote a marketing draft (M7). */
  CONTENT_GENERATED = 'CONTENT_GENERATED',
  /** A staff member sent a draft to the owner. */
  CONTENT_SUBMITTED = 'CONTENT_SUBMITTED',
  /** The owner approved content for publishing. */
  CONTENT_APPROVED = 'CONTENT_APPROVED',
  /** The owner sent content back; `new_value` holds the reason. */
  CONTENT_REJECTED = 'CONTENT_REJECTED',
  /** A social page was connected to a hotel (M11). The token itself is never logged. */
  SOCIAL_ACCOUNT_CONNECTED = 'SOCIAL_ACCOUNT_CONNECTED',
  /** A social page was disconnected; anything still scheduled for it was cancelled. */
  SOCIAL_ACCOUNT_DISCONNECTED = 'SOCIAL_ACCOUNT_DISCONNECTED',
  /** Approved content was put on the calendar (M9). */
  CONTENT_SCHEDULED = 'CONTENT_SCHEDULED',
  /** A scheduled post was taken off the calendar before it went out. */
  SCHEDULE_CANCELLED = 'SCHEDULE_CANCELLED',
  /** A post went out; `new_value` holds the platform's own id for it. */
  CONTENT_PUBLISHED = 'CONTENT_PUBLISHED',
  /** The platform refused a post; `new_value` holds what it said. */
  CONTENT_PUBLISH_FAILED = 'CONTENT_PUBLISH_FAILED',
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
