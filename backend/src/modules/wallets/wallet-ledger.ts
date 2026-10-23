import { Injectable } from '@nestjs/common';
import type { Prisma, WalletTxnType } from '../../generated/prisma/client';

/** The single platform wallet, created by the migration that added wallet owner types (money-rules §5). */
export const PLATFORM_WALLET_ID = '00000000-0000-0000-0000-000000000001';

export interface LedgerEntry {
  walletId: string;
  type: WalletTxnType;
  /** Signed: positive credits the wallet, negative debits it. */
  amount: Prisma.Decimal;
  /** Which balance moves: money still held for a stay (`pending`) or money the owner can use (`available`). */
  balance: 'pending' | 'available';
  /** Unique across all movements, so a retried webhook or decision writes the row once (P7, P11). */
  idempotencyKey: string;
  bookingId?: string;
  platformManagerId?: string;
  description?: string;
}

/**
 * Every real money movement is one `wallet_transaction` row plus the matching balance change, in the caller's
 * transaction (money model: invoice status + wallet_transaction). `balance_after` is the wallet's available plus
 * pending balance after the movement.
 */
@Injectable()
export class WalletLedger {
  /** Hotel wallets are created on their first movement. */
  async hotelWallet(tx: Prisma.TransactionClient, hotelId: string) {
    return tx.wallet.upsert({
      where: { hotelId },
      create: { hotelId, ownerType: 'HOTEL' },
      update: {},
      select: { walletId: true },
    });
  }

  /** Customer wallets are created on their first movement (refunds). */
  async customerWallet(tx: Prisma.TransactionClient, customerId: string) {
    return tx.wallet.upsert({
      where: { customerId },
      create: { customerId, ownerType: 'CUSTOMER' },
      update: {},
      select: { walletId: true },
    });
  }

  /** The balance update locks the wallet row, so concurrent movements of one wallet get consistent `balance_after`. */
  async post(tx: Prisma.TransactionClient, entry: LedgerEntry) {
    const wallet = await tx.wallet.update({
      where: { walletId: entry.walletId },
      data:
        entry.balance === 'pending'
          ? { balancePending: { increment: entry.amount } }
          : { balanceAvailable: { increment: entry.amount } },
      select: { balanceAvailable: true, balancePending: true },
    });
    return tx.walletTransaction.create({
      data: {
        walletId: entry.walletId,
        bookingId: entry.bookingId,
        platformManagerId: entry.platformManagerId,
        type: entry.type,
        amount: entry.amount,
        balanceAfter: wallet.balanceAvailable.plus(wallet.balancePending),
        description: entry.description,
        idempotencyKey: entry.idempotencyKey,
      },
    });
  }
}
