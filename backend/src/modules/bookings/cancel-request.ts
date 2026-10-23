import type { Prisma } from '../../generated/prisma/client';
import { AuditAction } from '../audit/audit.service';

/**
 * A customer's cancellation, kept as an `audit_log` row on the booking (no extra column or table, decision P11): the
 * reason shown to the hotel and the fee and refund computed when the customer cancelled, so a later decision pays
 * exactly what the customer was told. A booking may have several (cancel, rejected, cancel again); the latest counts.
 */
export interface CancelRequest {
  at: Date;
  reason: string;
  paid: number;
  fee: number;
  refund: number;
}

type Db = Pick<Prisma.TransactionClient, 'auditLog'>;

export async function latestCancelRequest(
  db: Db,
  bookingId: string,
): Promise<CancelRequest | null> {
  const row = await db.auditLog.findFirst({
    where: {
      action: AuditAction.BOOKING_CANCEL_REQUESTED,
      entityType: 'booking',
      entityId: bookingId,
    },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true, newValue: true },
  });
  if (!row?.newValue) return null;
  const value = JSON.parse(row.newValue) as Omit<CancelRequest, 'at'>;
  return { ...value, at: row.createdAt };
}

export function recordCancelRequest(
  db: Db,
  input: {
    bookingId: string;
    customerId: string;
    /** The same instant as `cancelled_at`, so the timeline keeps its order. */
    at: Date;
    ip?: string;
    request: Omit<CancelRequest, 'at'>;
  },
) {
  return db.auditLog.create({
    data: {
      action: AuditAction.BOOKING_CANCEL_REQUESTED,
      customerId: input.customerId,
      entityType: 'booking',
      entityId: input.bookingId,
      newValue: JSON.stringify(input.request),
      ipAddress: input.ip,
      createdAt: input.at,
    },
  });
}
