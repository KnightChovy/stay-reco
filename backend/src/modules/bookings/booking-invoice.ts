import type { BookingInvoice } from '@stayreco/shared';
import { toNumber } from '../../common/http/decimal';
import { type AddOnPayment, Prisma } from '../../generated/prisma/client';
import { AuditAction } from '../audit/audit.service';
import { LOYALTY_ACTIONS } from '../loyalty/loyalty.service';
import { pointsValue } from '../loyalty/points';
import type { BookingWithDetails } from './booking.mapper';

/**
 * What the invoice row does not keep apart: `invoice.discount_amount` is the promotion or voucher **plus** the points
 * (money-rules §2.1). Both halves are in the audit log - the discount amount on `BOOKING_DISCOUNT_APPLIED`, the
 * points on the loyalty `SPENT` entry - the same split the platform figures read.
 */
export interface InvoiceParts {
  /** From `BOOKING_DISCOUNT_APPLIED`; null when the booking has no discount or the row was never written. */
  discountAmount: number | null;
  pointsUsed: number;
}

type Db = Pick<Prisma.TransactionClient, 'auditLog'>;

const amountOf = (value: string | null, key: 'amount' | 'points') => {
  const parsed = JSON.parse(value ?? '{}') as Record<string, unknown>;
  return Math.abs(Number(parsed[key] ?? 0));
};

export async function loadInvoiceParts(
  db: Db,
  booking: {
    bookingId: string;
    promotionId: string | null;
    loyaltyProgramId: string | null;
  },
): Promise<InvoiceParts> {
  const mentions = `"bookingId":"${booking.bookingId}"`;
  const [discount, spent] = await Promise.all([
    booking.promotionId
      ? db.auditLog.findFirst({
          where: {
            action: AuditAction.BOOKING_DISCOUNT_APPLIED,
            newValue: { contains: mentions },
          },
          select: { newValue: true },
        })
      : null,
    booking.loyaltyProgramId
      ? db.auditLog.findFirst({
          where: {
            action: LOYALTY_ACTIONS.SPENT,
            entityType: 'loyalty_account',
            newValue: { contains: mentions },
          },
          orderBy: { createdAt: 'asc' },
          select: { newValue: true },
        })
      : null,
  ]);
  return {
    discountAmount: discount ? amountOf(discount.newValue, 'amount') : null,
    pointsUsed: spent ? amountOf(spent.newValue, 'points') : 0,
  };
}

/** The add-on lines of one kind, summed. */
export function addOnsOf(
  b: { addOns: { payment: AddOnPayment; amount: Prisma.Decimal }[] },
  payment: AddOnPayment,
): Prisma.Decimal {
  return b.addOns
    .filter((l) => l.payment === payment)
    .reduce((n, l) => n.plus(l.amount), new Prisma.Decimal(0));
}

export function toBookingInvoice(
  b: BookingWithDetails,
  parts: InvoiceParts,
): BookingInvoice {
  const invoice = b.invoice!;
  const subtracted = invoice.discountAmount;
  const hasDiscount = b.promotionId !== null;
  const hasPoints = parts.pointsUsed > 0;

  // One of the two alone takes the whole subtraction. With both, the discount amount comes from its audit row; if
  // that write failed (it is not in the booking's transaction), the points are valued at the programme's rate and
  // the discount is the rest.
  let pointsAmount = new Prisma.Decimal(0);
  if (hasPoints) {
    if (!hasDiscount) pointsAmount = subtracted;
    else if (parts.discountAmount !== null)
      pointsAmount = subtracted.minus(parts.discountAmount);
    else if (b.loyaltyProgram)
      pointsAmount = pointsValue(
        parts.pointsUsed,
        b.loyaltyProgram.pointValue,
        subtracted,
      );
  }
  const discountAmount = subtracted.minus(pointsAmount);

  return {
    number: invoice.invoiceNumber,
    paymentMethod: invoice.paymentMethod,
    subtotal: toNumber(invoice.subtotal),
    addOnsTotal: toNumber(addOnsOf(b, 'PREPAID')),
    discount:
      hasDiscount && b.promotion
        ? {
            kind: b.voucher ? 'VOUCHER' : 'PROMOTION',
            name: b.promotion.name,
            code: b.voucher?.code ?? null,
            amount: toNumber(discountAmount),
          }
        : null,
    points: hasPoints
      ? { used: parts.pointsUsed, amount: toNumber(pointsAmount) }
      : null,
    tax: toNumber(invoice.taxAmount),
    total: toNumber(invoice.totalAmount),
    frontDeskDue: toNumber(addOnsOf(b, 'FRONT_DESK')),
    currency: invoice.currency,
  };
}
