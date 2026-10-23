import type { Prisma, UserRole } from '../../generated/prisma/client';
import { AuditAction } from '../audit/audit.service';

/**
 * What happened to a booking after it was paid, kept as `audit_log` rows on the booking (no extra column or table,
 * decision P11): the customer's cancellations, staff forwarding and the hotel's refund decisions.
 */
const HISTORY_ACTIONS = {
  [AuditAction.BOOKING_CANCEL_REQUESTED]: 'CANCEL_REQUESTED',
  [AuditAction.REFUND_FORWARDED]: 'REFUND_FORWARDED',
  [AuditAction.REFUND_APPROVED]: 'REFUND_APPROVED',
  [AuditAction.REFUND_AUTO_APPROVED]: 'REFUND_APPROVED',
  [AuditAction.REFUND_REJECTED]: 'REFUND_REJECTED',
} as const;

type HistoryAction = keyof typeof HISTORY_ACTIONS;

/**
 * A customer's cancellation: the reason shown to the hotel and the fee and refund computed when the customer
 * cancelled, so a later decision pays exactly what the customer was told. A booking may have several (cancel,
 * rejected, cancel again); the latest counts.
 */
export interface CancelRequest {
  at: Date;
  reason: string;
  paid: number;
  fee: number;
  refund: number;
}

export interface BookingHistory {
  cancelRequest: CancelRequest | null;
  /** The hotel rejected the latest cancel request. */
  rejection: { reason: string; at: Date } | null;
  /** Timeline entries, oldest first. */
  events: { at: Date; event: string }[];
}

type Db = Pick<Prisma.TransactionClient, 'auditLog'>;

/** The audit column of each actor; the account id is the role row's id. */
const ACTOR_COLUMN = {
  CUSTOMER: 'customerId',
  HOTEL_STAFF: 'hotelStaffId',
  HOTEL_PARTNER: 'hotelPartnerId',
} as const satisfies Partial<
  Record<UserRole, keyof Prisma.AuditLogUncheckedCreateInput>
>;

export function recordBookingEvent(
  db: Db,
  input: {
    action: HistoryAction;
    bookingId: string;
    /** Null for the system (automatic approval). */
    actor: { role: keyof typeof ACTOR_COLUMN; accountId: string } | null;
    /** The same instant the booking was changed with, so the timeline keeps its order. */
    at: Date;
    value: Record<string, unknown>;
    ip?: string;
  },
) {
  return db.auditLog.create({
    data: {
      action: input.action,
      ...(input.actor && {
        [ACTOR_COLUMN[input.actor.role]]: input.actor.accountId,
      }),
      entityType: 'booking',
      entityId: input.bookingId,
      newValue: JSON.stringify(input.value),
      ipAddress: input.ip,
      createdAt: input.at,
    },
  });
}

export async function loadBookingHistory(
  db: Db,
  bookingId: string,
): Promise<BookingHistory> {
  const rows = await db.auditLog.findMany({
    where: {
      entityType: 'booking',
      entityId: bookingId,
      action: { in: Object.keys(HISTORY_ACTIONS) },
    },
    orderBy: { createdAt: 'asc' },
    select: { action: true, createdAt: true, newValue: true },
  });

  let cancelRequest: CancelRequest | null = null;
  let rejection: BookingHistory['rejection'] = null;
  for (const row of rows) {
    const action = row.action as HistoryAction;
    const value = JSON.parse(row.newValue ?? '{}') as Record<string, unknown>;
    if (action === AuditAction.BOOKING_CANCEL_REQUESTED) {
      cancelRequest = {
        ...(value as Omit<CancelRequest, 'at'>),
        at: row.createdAt,
      };
      rejection = null;
    } else if (action === AuditAction.REFUND_REJECTED) {
      rejection = { reason: String(value.reason), at: row.createdAt };
    }
  }
  return {
    cancelRequest,
    rejection,
    events: rows.map((r) => ({
      at: r.createdAt,
      event: HISTORY_ACTIONS[r.action as HistoryAction],
    })),
  };
}
