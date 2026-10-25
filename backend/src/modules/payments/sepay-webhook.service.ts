import { Injectable, Logger } from '@nestjs/common';
import type { SepayWebhookResult } from '@stayreco/shared';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditAction } from '../audit/audit.service';
import { PaymentConfirmationService } from './payment-confirmation.service';
import {
  bookingCodeOf,
  type SepayTransaction,
  transactionTime,
} from './sepay-webhook';

/** What happened to one notification (answered to SePay, which only reads `success`). */
export type SepayOutcome = SepayWebhookResult['outcome'];

/**
 * SePay's webhook for every bank transaction on the platform account (decision P7, money-rules §4). Incoming
 * transfers carrying a booking code and exactly its amount confirm the booking through `PaymentConfirmationService`;
 * anything else is written to `audit_log` for the team to handle by hand (SRS 3.5.4, 3.5.5). Every notification that
 * passed the API key check is answered with success, so SePay does not resend what was already handled.
 */
@Injectable()
export class SepayWebhookService {
  private readonly logger = new Logger('SepayWebhook');

  constructor(
    private readonly prisma: PrismaService,
    private readonly payments: PaymentConfirmationService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async handle(transaction: SepayTransaction): Promise<SepayOutcome> {
    if (transaction.transferType !== 'in') return 'IGNORED_OUTGOING';

    const account = this.config.get('SEPAY_ACCOUNT_NUMBER', { infer: true });
    if (transaction.accountNumber && transaction.accountNumber !== account) {
      return this.record(
        AuditAction.SEPAY_TRANSFER_UNMATCHED,
        transaction,
        'OTHER_ACCOUNT',
      );
    }
    const code = bookingCodeOf(transaction);
    if (!code) {
      return this.record(
        AuditAction.SEPAY_TRANSFER_UNMATCHED,
        transaction,
        'NO_BOOKING_CODE',
      );
    }

    const result = await this.payments.confirm({
      code,
      amount: transaction.transferAmount,
      transactionId: String(transaction.id),
      paidAt: transactionTime(transaction.transactionDate, new Date()),
    });
    switch (result.status) {
      case 'CONFIRMED':
        this.logger.log(`Booking ${code} paid (SePay ${transaction.id})`);
        return 'CONFIRMED';
      case 'DUPLICATE':
        return 'DUPLICATE';
      case 'UNKNOWN_CODE':
        return this.record(
          AuditAction.SEPAY_TRANSFER_UNMATCHED,
          transaction,
          'UNKNOWN_CODE',
          { code },
        );
      case 'AMOUNT_MISMATCH':
        return this.record(
          AuditAction.SEPAY_TRANSFER_UNMATCHED,
          transaction,
          'AMOUNT_MISMATCH',
          { code, bookingId: result.bookingId },
        );
      case 'NOT_PENDING':
        return this.record(
          AuditAction.SEPAY_TRANSFER_LATE,
          transaction,
          result.bookingStatus,
          { code, bookingId: result.bookingId },
        );
    }
  }

  /**
   * One audit row per SePay transaction and action: SePay may resend a notification if our answer is lost, and the
   * team should see each transfer once.
   */
  private async record(
    action: AuditAction,
    transaction: SepayTransaction,
    reason: string,
    extra: { code?: string; bookingId?: string } = {},
  ): Promise<SepayOutcome> {
    const outcome =
      action === AuditAction.SEPAY_TRANSFER_LATE ? 'LATE' : 'UNMATCHED';
    const seen = await this.prisma.auditLog.count({
      where: {
        action,
        newValue: { contains: `"sepayId":${transaction.id},` },
      },
    });
    if (seen) return outcome;

    await this.prisma.auditLog.create({
      data: {
        action,
        entityType: extra.bookingId ? 'booking' : 'sepay_transaction',
        entityId: extra.bookingId,
        newValue: JSON.stringify({
          sepayId: transaction.id,
          reason,
          code: extra.code ?? null,
          amount: transaction.transferAmount,
          content: transaction.content ?? null,
          accountNumber: transaction.accountNumber ?? null,
          referenceCode: transaction.referenceCode ?? null,
          transactionDate: transaction.transactionDate ?? null,
        }),
      },
    });
    this.logger.warn(
      `SePay ${transaction.id}: ${reason}${extra.code ? ` (${extra.code})` : ''}, kept for manual handling`,
    );
    return outcome;
  }
}
