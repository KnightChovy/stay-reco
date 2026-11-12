import { PAYOUT_PROCESSING_DAYS, type PayoutStatus } from '@stayreco/shared';
import { Prisma } from '../../generated/prisma/client';
import { AuditAction } from '../audit/audit.service';

/**
 * A withdrawal has no table of its own (decision M1): it is the `PAYOUT` wallet movement that reserved the amount,
 * and its state is the latest of these audit events on that movement (`entity_type` `wallet_transaction`).
 */
export const STATUS_OF_EVENT = {
  [AuditAction.PAYOUT_REQUESTED]: 'PENDING',
  [AuditAction.PAYOUT_PAID]: 'PAID',
  [AuditAction.PAYOUT_REJECTED]: 'REJECTED',
  [AuditAction.PAYOUT_CANCELLED]: 'CANCELLED',
} as const satisfies Record<string, PayoutStatus>;

export type PayoutEvent = keyof typeof STATUS_OF_EVENT;
export const PAYOUT_EVENTS = Object.keys(STATUS_OF_EVENT) as PayoutEvent[];

export const ENTITY_TYPE = 'wallet_transaction';

export const eventsOf = (statuses: readonly PayoutStatus[]) =>
  PAYOUT_EVENTS.filter((e) => statuses.includes(STATUS_OF_EVENT[e]));

/** What each event keeps in `new_value`. */
export interface RequestedValue {
  hotelId: string;
  amount: number;
  /** The approved verification request whose beneficiary account the money goes to (M2); never the number itself. */
  verificationRequestId: string;
}
export interface PaidValue {
  bankReference: string;
}
export interface RejectedValue {
  reason: string;
}

const ACTOR_COLUMN = {
  HOTEL_PARTNER: 'hotelPartnerId',
  PLATFORM_MANAGER: 'platformManagerId',
} as const;

export type PayoutActor = {
  role: keyof typeof ACTOR_COLUMN;
  accountId: string;
};

export function recordPayoutEvent(
  db: Pick<Prisma.TransactionClient, 'auditLog'>,
  input: {
    action: PayoutEvent | AuditAction.PAYOUT_ACCOUNT_VIEWED;
    payoutId: string;
    actor: PayoutActor;
    value?: RequestedValue | PaidValue | RejectedValue;
    ip?: string;
  },
) {
  return db.auditLog.create({
    data: {
      action: input.action,
      [ACTOR_COLUMN[input.actor.role]]: input.actor.accountId,
      entityType: ENTITY_TYPE,
      entityId: input.payoutId,
      newValue: input.value ? JSON.stringify(input.value) : null,
      ipAddress: input.ip,
    },
  });
}

/** The SQL of a withdrawal's current state event, for a `wallet_transaction wt` row in the query. */
export const latestEventSql = Prisma.sql`(
  SELECT a.action FROM audit_log a
  WHERE a.entity_type = ${ENTITY_TYPE} AND a.entity_id = wt.wallet_transaction_id
    AND a.action IN (${Prisma.join(PAYOUT_EVENTS)})
  ORDER BY a.created_at DESC, a.audit_log_id DESC
  LIMIT 1)`;

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
/** Vietnam is UTC+7 all year. */
const VIETNAM_OFFSET = 7 * HOUR;

/**
 * `at` plus the working days a manager has (BR-22): Saturdays and Sundays of the Vietnam calendar are skipped, public
 * holidays are not known. A request on Friday 10:00 is due on Tuesday 10:00; one on Saturday on Tuesday too.
 */
export function payoutDueBy(at: Date, days = PAYOUT_PROCESSING_DAYS): Date {
  let local = at.getTime() + VIETNAM_OFFSET;
  let left = days;
  while (left > 0) {
    local += DAY;
    const weekday = new Date(local).getUTCDay();
    if (weekday !== 0 && weekday !== 6) left--;
  }
  return new Date(local - VIETNAM_OFFSET);
}
