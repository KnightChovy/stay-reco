import { Injectable } from '@nestjs/common';
import type {
  WalletTransaction,
  WalletTransactionListQuery,
} from '@stayreco/shared';
import { Paginated } from '../../common/http/api-response';
import { addDays, vietnamDateTime } from '../../common/http/calendar-date';
import { toNumber } from '../../common/http/decimal';
import { pageArgs } from '../../common/http/pagination';
import type { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const transactionInclude = {
  booking: {
    select: { bookingId: true, invoice: { select: { invoiceNumber: true } } },
  },
} satisfies Prisma.WalletTransactionInclude;

type TransactionRow = Prisma.WalletTransactionGetPayload<{
  include: typeof transactionInclude;
}>;

const toWalletTransaction = (t: TransactionRow): WalletTransaction => ({
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

/** A hotel's wallet ledger for its owner; hotel access was checked by `HotelAccessRequired`. */
@Injectable()
export class HotelWalletService {
  constructor(private readonly prisma: PrismaService) {}

  /** Newest first. A hotel without a wallet yet (no money movement) has an empty list. */
  async transactions(
    hotelId: string,
    query: WalletTransactionListQuery,
  ): Promise<Paginated<WalletTransaction>> {
    const where = {
      wallet: { hotelId },
      ...(query.type && { type: { in: query.type } }),
      ...((query.from || query.to) && {
        createdAt: {
          ...(query.from && { gte: startOf(query.from) }),
          ...(query.to && { lt: startOf(addDays(query.to, 1)) }),
        },
      }),
    } satisfies Prisma.WalletTransactionWhereInput;
    const [rows, total] = await Promise.all([
      this.prisma.walletTransaction.findMany({
        where,
        include: transactionInclude,
        orderBy: [{ createdAt: 'desc' }, { walletTransactionId: 'asc' }],
        ...pageArgs(query),
      }),
      this.prisma.walletTransaction.count({ where }),
    ]);
    return Paginated.of(rows.map(toWalletTransaction), { ...query, total });
  }
}
