import { Prisma, type UserRole } from '../../generated/prisma/client';
import { AuditAction } from '../audit/audit.service';

/**
 * What happened to a booking, kept as `audit_log` rows on the booking (no extra column or table, decisions P11, O15):
 * payment or expiry, the customer's cancellations, staff forwarding, the hotel's refund decisions and the front desk.
 */
const HISTORY_ACTIONS = {
  [AuditAction.BOOKING_CONFIRMED]: 'PAID',
  [AuditAction.BOOKING_EXPIRED]: 'EXPIRED',
  [AuditAction.BOOKING_CANCEL_REQUESTED]: 'CANCEL_REQUESTED',
  [AuditAction.REFUND_FORWARDED]: 'REFUND_FORWARDED',
  [AuditAction.REFUND_APPROVED]: 'REFUND_APPROVED',
  [AuditAction.REFUND_AUTO_APPROVED]: 'REFUND_APPROVED',
  [AuditAction.REFUND_REJECTED]: 'REFUND_REJECTED',
  [AuditAction.BOOKING_CHECKED_IN]: 'CHECKED_IN',
  [AuditAction.BOOKING_CHECKED_OUT]: 'COMPLETED',
  [AuditAction.BOOKING_NO_SHOW]: 'NO_SHOW',
  [AuditAction.BOOKING_CHANGE_REQUESTED]: 'CHANGE_REQUESTED',
  [AuditAction.BOOKING_CHANGE_ACCEPTED]: 'CHANGE_ACCEPTED',
  [AuditAction.BOOKING_CHANGE_REJECTED]: 'CHANGE_REJECTED',
} as const;

/** The audit actions that open and close a change request, latest first decides whether one is waiting. */
export const CHANGE_ACTIONS = [
  AuditAction.BOOKING_CHANGE_REQUESTED,
  AuditAction.BOOKING_CHANGE_ACCEPTED,
  AuditAction.BOOKING_CHANGE_REJECTED,
];

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

export interface StayRoom {
  id: string;
  roomNumber: string;
}

/** Guest details a change request may set (O11); `null` clears the arrival time or the special requests. */
export interface GuestChanges {
  guestName?: string;
  contactPhone?: string;
  arrivalTime?: string | null;
  specialRequests?: string | null;
}

/** The late check-out fee kept with the check-out event; paid at the front desk (money-rules §5.5). */
export interface LateCheckoutRecord {
  minutesLate: number;
  computedFee: number;
  fee: number;
  reason: string | null;
}

/** The latest change request of a booking (UC25, UC43). */
export interface ChangeRequest {
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  changes: GuestChanges;
  requestedAt: Date;
  decidedAt: Date | null;
  /** Set when the hotel rejected it. */
  reason: string | null;
}

export interface BookingHistory {
  cancelRequest: CancelRequest | null;
  /** The hotel rejected the latest cancel request. */
  rejection: { reason: string; at: Date } | null;
  /** The rooms assigned at check-in, null before it. */
  checkedInRooms: StayRoom[] | null;
  /** Recorded at check-out when the guest left after the check-out time and its grace (L4–L6). */
  lateCheckout: LateCheckoutRecord | null;
  changeRequest: ChangeRequest | null;
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
    /** Null for the system (automatic approval, automatic no-show). */
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
  let checkedInRooms: StayRoom[] | null = null;
  let lateCheckout: LateCheckoutRecord | null = null;
  // Not narrowed to null: the loop below reads it after earlier rows set it.
  let changeRequest = null as ChangeRequest | null;
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
    } else if (action === AuditAction.BOOKING_CHECKED_IN) {
      checkedInRooms = value.rooms as StayRoom[];
    } else if (action === AuditAction.BOOKING_CHECKED_OUT && value.lateFee) {
      lateCheckout = value.lateFee as LateCheckoutRecord;
    } else if (action === AuditAction.BOOKING_CHANGE_REQUESTED) {
      changeRequest = {
        status: 'PENDING',
        changes: value.changes as GuestChanges,
        requestedAt: row.createdAt,
        decidedAt: null,
        reason: null,
      };
    } else if (
      changeRequest &&
      action === AuditAction.BOOKING_CHANGE_ACCEPTED
    ) {
      changeRequest = {
        ...changeRequest,
        status: 'ACCEPTED',
        decidedAt: row.createdAt,
      };
    } else if (
      changeRequest &&
      action === AuditAction.BOOKING_CHANGE_REJECTED
    ) {
      changeRequest = {
        ...changeRequest,
        status: 'REJECTED',
        decidedAt: row.createdAt,
        reason: String(value.reason),
      };
    }
  }
  return {
    cancelRequest,
    rejection,
    checkedInRooms,
    lateCheckout,
    changeRequest,
    events: rows.map((r) => ({
      at: r.createdAt,
      event: HISTORY_ACTIONS[r.action as HistoryAction],
    })),
  };
}

/** Shown to the customer when the booking stopped being CONFIRMED while a change request waited. */
export const CHANGE_CLOSED_REASON =
  'Đơn không còn ở trạng thái chờ nhận phòng nên yêu cầu được đóng tự động.';

/**
 * Closes the waiting change request, if any, when the booking leaves CONFIRMED (cancelled, checked in, no-show): a
 * rejection by the system with a fixed reason, so the customer never sees a request waiting for nothing. Call in the
 * transaction that changes the status, with its instant: the row is dated one millisecond earlier, so the timeline
 * (ordered by time; audit ids are random) always shows it just before the status change.
 */
export async function closePendingChange(db: Db, bookingId: string, at: Date) {
  const { changeRequest } = await loadBookingHistory(db, bookingId);
  if (changeRequest?.status !== 'PENDING') return;
  await recordBookingEvent(db, {
    action: AuditAction.BOOKING_CHANGE_REJECTED,
    bookingId,
    actor: null,
    at: new Date(at.getTime() - 1),
    value: { reason: CHANGE_CLOSED_REASON, automatic: true },
  });
}

/**
 * CONFIRMED bookings of the hotel whose latest change request is still waiting (`?changeRequest=PENDING`), with when
 * it was made. One index lookup per booking on `audit_log(entity_type, entity_id, created_at)`.
 */
export async function pendingChangeRequests(
  db: Pick<Prisma.TransactionClient, '$queryRaw'>,
  hotelId: string,
): Promise<{ bookingId: string; requestedAt: Date }[]> {
  const rows = await db.$queryRaw<{ booking_id: string; requested_at: Date }[]>`
    SELECT b.booking_id, last.created_at AS requested_at FROM booking b
    JOIN room_type rt ON rt.room_type_id = b.room_type_id
    JOIN LATERAL (
      SELECT a.action, a.created_at FROM audit_log a
      WHERE a.entity_type = 'booking' AND a.entity_id = b.booking_id
        AND a.action IN (${Prisma.join(CHANGE_ACTIONS)})
      ORDER BY a.created_at DESC LIMIT 1
    ) last ON true
    WHERE rt.hotel_id = ${hotelId}::uuid AND b.status = 'CONFIRMED'
      AND last.action = ${AuditAction.BOOKING_CHANGE_REQUESTED}
    ORDER BY last.created_at`;
  return rows.map((r) => ({
    bookingId: r.booking_id,
    requestedAt: r.requested_at,
  }));
}
