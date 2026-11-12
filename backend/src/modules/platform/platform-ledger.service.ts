import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  WalletTransaction,
  WalletTransactionListQuery,
} from '@stayreco/shared';
import { ErrorCode } from '../../common/errors/error-code';
import { Paginated } from '../../common/http/api-response';
import { pageArgs } from '../../common/http/pagination';
import { isUuid } from '../../common/hotel-access/hotel-access.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  toWalletTransaction,
  transactionInclude,
  transactionWhere,
} from '../wallets/wallet.mapper';

/** Any hotel's wallet ledger for a platform manager: the owner's own view (SRS 3.15.2). */
@Injectable()
export class PlatformLedgerService {
  constructor(private readonly prisma: PrismaService) {}

  async hotelTransactions(
    hotelId: string,
    query: WalletTransactionListQuery,
  ): Promise<Paginated<WalletTransaction>> {
    const exists =
      isUuid(hotelId) &&
      (await this.prisma.hotel.count({ where: { hotelId } })) > 0;
    if (!exists) {
      throw new NotFoundException({
        code: ErrorCode.HOTEL_NOT_FOUND,
        message: 'Hotel not found',
      });
    }
    const where = transactionWhere({ hotelId }, query);
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
