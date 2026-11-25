import type {
  WalletTransaction,
  WalletTransactionListQuery,
} from '@stayreco/shared';
import { addDays, vietnamDateTime } from '../../common/http/calendar-date';
import { toNumber } from '../../common/http/decimal';
import type { Prisma } from '../../generated/prisma/client';

/** Shared by the hotel and the customer wallet: the movements of both have the same shape. */

export const transactionInclude = {
  booking: {
    select: { bookingId: true, invoice: { select: { invoiceNumber: true } } },
  },
} satisfies Prisma.WalletTransactionInclude;

export type TransactionRow = Prisma.WalletTransactionGetPayload<{
  include: typeof transactionInclude;
}>;

export const toWalletTransaction = (t: TransactionRow): WalletTransaction => ({
  id: t.walletTransactionId,
  type: t.type,
  amount: toNumber(t.amount),
  balanceAfter: toNumber(t.balanceAfter),
  description: t.description,
  // Every booking that moves money has an invoice; the code is its number.
  booking: t.booking?.invoice
    ? { id: t.booking.bookingId, code: t.booking.invoice.invoiceNumber }
    : null,
  createdAt: t.createdAt.toISOString(),
});

/** First instant of a Vietnam date. */
const startOf = (date: string) => vietnamDateTime(date, '00:00');

/**
 * The filters every wallet ledger shares: movement types, and a Vietnam date range with both ends inclusive.
 * `owner` picks whose wallet it is, so the caller cannot accidentally read someone else's.
 */
export const transactionWhere = (
  owner: Prisma.WalletWhereInput,
  query: WalletTransactionListQuery,
) =>
  ({
    wallet: owner,
    ...(query.type && { type: { in: query.type } }),
    ...((query.from || query.to) && {
      createdAt: {
        ...(query.from && { gte: startOf(query.from) }),
        ...(query.to && { lt: startOf(addDays(query.to, 1)) }),
      },
    }),
  }) satisfies Prisma.WalletTransactionWhereInput;
