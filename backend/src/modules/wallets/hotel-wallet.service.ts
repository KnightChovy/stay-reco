import { Injectable } from '@nestjs/common';
import type {
  WalletTransaction,
  WalletTransactionListQuery,
} from '@stayreco/shared';
import { Paginated } from '../../common/http/api-response';
import { pageArgs } from '../../common/http/pagination';
import { PrismaService } from '../../prisma/prisma.service';
import {
  toWalletTransaction,
  transactionInclude,
  transactionWhere,
} from './wallet.mapper';

/** A hotel's wallet ledger for its owner; hotel access was checked by `HotelAccessRequired`. */
@Injectable()
export class HotelWalletService {
  constructor(private readonly prisma: PrismaService) {}

  /** Newest first. A hotel without a wallet yet (no money movement) has an empty list. */
  async transactions(
    hotelId: string,
    query: WalletTransactionListQuery,
  ): Promise<Paginated<WalletTransaction>> {
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
