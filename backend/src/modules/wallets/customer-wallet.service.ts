import { Injectable } from '@nestjs/common';
import type {
  CustomerWallet,
  WalletTransaction,
  WalletTransactionListQuery,
} from '@stayreco/shared';
import { Paginated } from '../../common/http/api-response';
import { toNumber } from '../../common/http/decimal';
import { pageArgs } from '../../common/http/pagination';
import { PrismaService } from '../../prisma/prisma.service';
import {
  toWalletTransaction,
  transactionInclude,
  transactionWhere,
} from './wallet.mapper';

/**
 * The customer's own wallet (money-rules §5.1). It is filled by refunds and spent on a whole booking; it is created
 * on its first movement, so a customer who has never been refunded simply reads a balance of 0.
 */
@Injectable()
export class CustomerWalletService {
  constructor(private readonly prisma: PrismaService) {}

  async balance(customerId: string): Promise<CustomerWallet> {
    const wallet = await this.prisma.wallet.findUnique({
      where: { customerId },
    });
    return {
      balanceAvailable: wallet ? toNumber(wallet.balanceAvailable) : 0,
      balancePending: wallet ? toNumber(wallet.balancePending) : 0,
      currency: wallet?.currency ?? 'VND',
      updatedAt: wallet?.updatedAt.toISOString() ?? null,
    };
  }

  /** Newest first. A customer who has never had a movement reads an empty list. */
  async transactions(
    customerId: string,
    query: WalletTransactionListQuery,
  ): Promise<Paginated<WalletTransaction>> {
    const where = transactionWhere({ customerId }, query);
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
