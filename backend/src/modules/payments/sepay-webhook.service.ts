import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import type { SepayWebhookResult } from '@stayreco/shared';
import { ConfigService } from '@nestjs/config';
import { ErrorCode } from '../../common/errors/error-code';
import type { Env } from '../../config/env';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditAction } from '../audit/audit.service';
import { PaymentConfirmationService } from './payment-confirmation.service';
import {
  bookingCodeOf,
  describeIssues,
  type SepayTransaction,
  sepayTransactionSchema,
  transactionTime,
} from './sepay-webhook';

/** What happened to one notification (answered to SePay, which only reads `success`). */
export type SepayOutcome = SepayWebhookResult['outcome'];

/** Raw payloads kept for manual handling are cut to this size. */
const MAX_RAW_PAYLOAD = 4000;

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

  /**
   * A body that does not fit even the lenient schema is logged with the failing fields and kept whole in the audit
   * log, then refused with 400: SePay resends it for up to 5 hours, so a fix deployed meanwhile still gets it.
   */
  async parse(body: unknown): Promise<SepayTransaction> {
    const result = sepayTransactionSchema.safeParse(body ?? {});
    if (result.success) return result.data;

    const problems = describeIssues(result.error, body);
    this.logger.error(`SePay payload refused: ${problems.join('; ')}`);
    const id = (body as { id?: unknown } | null)?.id;
    const raw = JSON.stringify(body ?? null).slice(0, MAX_RAW_PAYLOAD);
    await this.recordOnce(
      AuditAction.SEPAY_TRANSFER_UNMATCHED,
      id,
      {
        sepayId: id ?? null,
        reason: 'INVALID_PAYLOAD',
        problems,
        raw,
      },
      null,
    );
    throw new BadRequestException({
      code: ErrorCode.VALIDATION_ERROR,
      message: 'Validation failed',
      details: result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    });
  }

  async handle(transaction: SepayTransaction): Promise<SepayOutcome> {
    if (transaction.transferType !== 'in') return 'IGNORED_OUTGOING';

    const account = this.config.get('SEPAY_ACCOUNT_NUMBER', { infer: true });
    const received = transaction.accountNumber?.trim();
    if (received && received !== account.trim()) {
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
      transactionId: transaction.id,
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

  private async record(
    action: AuditAction,
    transaction: SepayTransaction,
    reason: string,
    extra: { code?: string; bookingId?: string } = {},
  ): Promise<SepayOutcome> {
    await this.recordOnce(
      action,
      transaction.id,
      {
        sepayId: transaction.id,
        reason,
        code: extra.code ?? null,
        amount: transaction.transferAmount,
        content: transaction.content,
        accountNumber: transaction.accountNumber,
        referenceCode: transaction.referenceCode,
        transactionDate: transaction.transactionDate,
      },
      extra.bookingId ?? null,
    );
    this.logger.warn(
      `SePay ${transaction.id}: ${reason}${extra.code ? ` (${extra.code})` : ''}, kept for manual handling`,
    );
    return action === AuditAction.SEPAY_TRANSFER_LATE ? 'LATE' : 'UNMATCHED';
  }

  /**
   * One audit row per SePay transaction and action: SePay resends a notification when an answer is lost or late, and
   * the team should see each transfer once. `sepayId` is always the first key, so the prefix identifies the row.
   */
  private async recordOnce(
    action: AuditAction,
    sepayId: unknown,
    value: { sepayId: unknown } & Record<string, unknown>,
    bookingId: string | null,
  ) {
    const prefix = `{"sepayId":${JSON.stringify(sepayId ?? null)},`;
    const seen =
      sepayId !== undefined &&
      sepayId !== null &&
      (await this.prisma.auditLog.count({
        where: { action, newValue: { startsWith: prefix } },
      })) > 0;
    if (seen) return;
    await this.prisma.auditLog.create({
      data: {
        action,
        entityType: bookingId ? 'booking' : 'sepay_transaction',
        entityId: bookingId,
        newValue: JSON.stringify(value),
      },
    });
  }
}
