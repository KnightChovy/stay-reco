import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  type AdminTransaction,
  type AdminTransactionDetail,
  type AdminTransactionListQuery,
  BOOKING_LIMITS,
  type PaymentSettings,
  type PaymentSettingsCheck,
  type UnmatchedTransfer,
  type UnmatchedTransferListQuery,
  WEBHOOK_SILENCE_DAYS,
} from '@stayreco/shared';
import { escapeLike } from '../../common/db/like';
import { ErrorCode } from '../../common/errors/error-code';
import { Paginated } from '../../common/http/api-response';
import {
  addDays,
  todayInVietnam,
  vietnamDateTime,
} from '../../common/http/calendar-date';
import { toNumber } from '../../common/http/decimal';
import { pageArgs } from '../../common/http/pagination';
import { isUuid } from '../../common/hotel-access/hotel-access.service';
import type { Env } from '../../config/env';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { platformPeriod } from '../platform/platform-stats.service';
import { details } from './audit-logs.service';

/** The demo account `SEPAY_ACCOUNT_NUMBER` defaults to (config/env.ts): not a real one. */
const DEMO_ACCOUNT = '0000000000';
const UNMATCHED = ['SEPAY_TRANSFER_UNMATCHED', 'SEPAY_TRANSFER_LATE'];
/** The export holds at most this many rows. */
const EXPORT_LIMIT = 10_000;
const DAY_MS = 86_400_000;

interface TransactionRow {
  invoiceId: string;
  bookingId: string;
  code: string;
  hotelId: string;
  hotelName: string;
  method: AdminTransaction['method'];
  status: AdminTransaction['status'];
  expected: Prisma.Decimal;
  confirmed: Prisma.Decimal | null;
  refunded: Prisma.Decimal;
  txn: string | null;
  paidAt: Date | null;
  createdAt: Date;
}

/**
 * One row per invoice with what the payment confirmation reported and the refunds. The JSON of an audit row is only
 * read inside `CASE` on its action: Postgres may test the WHERE terms in any order.
 */
const FROM = Prisma.sql`
  FROM invoice i
  JOIN booking b ON b.booking_id = i.booking_id
  JOIN hotel h ON h.hotel_id = b.hotel_id
  LEFT JOIN LATERAL (
    SELECT CASE WHEN a.action = 'BOOKING_CONFIRMED' THEN
      CASE WHEN jsonb_typeof(a.new_value::jsonb -> 'amount') = 'number'
        THEN (a.new_value::jsonb ->> 'amount')::numeric END END AS amount
    FROM audit_log a
    WHERE a.entity_type = 'booking' AND a.entity_id = b.booking_id AND a.action = 'BOOKING_CONFIRMED'
    ORDER BY a.created_at DESC
    LIMIT 1
  ) conf ON TRUE
  LEFT JOIN LATERAL (
    SELECT coalesce(sum(wt.amount), 0) AS amount
    FROM wallet_transaction wt JOIN wallet w ON w.wallet_id = wt.wallet_id
    WHERE wt.booking_id = b.booking_id AND w.owner_type = 'CUSTOMER' AND wt.type = 'REFUND' AND wt.amount > 0
  ) ref ON TRUE`;

const COLUMNS = Prisma.sql`
  SELECT i.invoice_id AS "invoiceId", b.booking_id AS "bookingId", i.invoice_number AS code,
    h.hotel_id AS "hotelId", h.name AS "hotelName", i.payment_method::text AS method,
    i.payment_status::text AS status, i.total_amount AS expected, conf.amount AS confirmed,
    ref.amount AS refunded, i.vnpay_txn_ref AS txn, i.paid_at AS "paidAt", i.created_at AS "createdAt"`;

const MISMATCH = Prisma.sql`(conf.amount IS NOT NULL AND conf.amount <> i.total_amount)`;

const toTransaction = (r: TransactionRow): AdminTransaction => ({
  invoiceId: r.invoiceId,
  booking: { id: r.bookingId, code: r.code },
  hotel: { id: r.hotelId, name: r.hotelName },
  method: r.method,
  status: r.status,
  expectedAmount: toNumber(r.expected),
  confirmedAmount: toNumber(r.confirmed),
  refunded: toNumber(r.refunded),
  gatewayTransactionId: r.txn,
  paidAt: r.paidAt?.toISOString() ?? null,
  createdAt: r.createdAt.toISOString(),
  mismatch: r.confirmed !== null && !r.confirmed.equals(r.expected),
});

const str = (v: unknown) =>
  typeof v === 'string' || typeof v === 'number' ? String(v) : null;

/**
 * Payments and refunds for the admin (UC78, UC79, SRS 3.16.4–3.16.6, decision M10). A transaction is the invoice of a
 * booking: the payment SePay or the customer wallet confirmed and the refunds. No status check with SePay (M10): the
 * detail shows what the webhook reported.
 */
@Injectable()
export class AdminPaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async transactions(
    query: AdminTransactionListQuery,
    now = new Date(),
  ): Promise<Paginated<AdminTransaction>> {
    const where = this.where(query, now);
    const [rows, [{ total }]] = await Promise.all([
      this.prisma.$queryRaw<TransactionRow[]>`
        ${COLUMNS} ${FROM} WHERE ${where}
        ORDER BY i.created_at DESC, i.invoice_id
        LIMIT ${query.pageSize} OFFSET ${(query.page - 1) * query.pageSize}`,
      this.prisma.$queryRaw<{ total: number }[]>`
        SELECT count(*)::int AS total ${FROM} WHERE ${where}`,
    ]);
    return Paginated.of(rows.map(toTransaction), { ...query, total });
  }

  /** Every transaction of the query (at most 10,000), for the export. */
  async allTransactions(
    query: Omit<AdminTransactionListQuery, 'page' | 'pageSize'>,
    now = new Date(),
  ) {
    const rows = await this.prisma.$queryRaw<TransactionRow[]>`
      ${COLUMNS} ${FROM} WHERE ${this.where(query, now)}
      ORDER BY i.created_at DESC, i.invoice_id
      LIMIT ${EXPORT_LIMIT}`;
    return rows.map(toTransaction);
  }

  async transaction(invoiceId: string): Promise<AdminTransactionDetail> {
    const [row] = isUuid(invoiceId)
      ? await this.prisma.$queryRaw<TransactionRow[]>`
          ${COLUMNS} ${FROM} WHERE i.invoice_id = ${invoiceId}::uuid`
      : [];
    if (!row) {
      throw new NotFoundException({
        code: ErrorCode.NOT_FOUND,
        message: 'Transaction not found',
      });
    }
    const [booking, events, moves] = await Promise.all([
      this.prisma.booking.findUniqueOrThrow({
        where: { bookingId: row.bookingId },
        select: {
          status: true,
          customer: {
            select: {
              customerId: true,
              userAccount: { select: { fullName: true, email: true } },
            },
          },
        },
      }),
      this.prisma.auditLog.findMany({
        where: { entityType: 'booking', entityId: row.bookingId },
        orderBy: [{ createdAt: 'asc' }, { auditLogId: 'asc' }],
        select: { action: true, createdAt: true, newValue: true },
      }),
      this.prisma.walletTransaction.findMany({
        where: { bookingId: row.bookingId },
        orderBy: [{ createdAt: 'asc' }, { walletTransactionId: 'asc' }],
        select: {
          type: true,
          amount: true,
          description: true,
          createdAt: true,
          wallet: { select: { ownerType: true } },
        },
      }),
    ]);
    const base = toTransaction(row);
    return {
      ...base,
      booking: { ...base.booking, status: booking.status },
      customer: {
        id: booking.customer.customerId,
        fullName: booking.customer.userAccount.fullName,
        email: booking.customer.userAccount.email,
      },
      events: events.map((e) => ({
        action: e.action,
        at: e.createdAt.toISOString(),
        details: details(e.newValue),
      })),
      walletMovements: moves.map((m) => ({
        wallet: m.wallet.ownerType,
        type: m.type,
        amount: toNumber(m.amount),
        description: m.description,
        createdAt: m.createdAt.toISOString(),
      })),
    };
  }

  /** SePay transfers that confirmed nothing or came late, newest first: to refund by hand. */
  async unmatched(
    query: UnmatchedTransferListQuery,
    now = new Date(),
  ): Promise<Paginated<UnmatchedTransfer>> {
    const period = platformPeriod(query, todayInVietnam(now));
    const where: Prisma.AuditLogWhereInput = {
      action: { in: UNMATCHED },
      createdAt: {
        gte: vietnamDateTime(period.from, '00:00'),
        lt: vietnamDateTime(addDays(period.to, 1), '00:00'),
      },
    };
    const [rows, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { auditLogId: 'desc' }],
        select: {
          auditLogId: true,
          action: true,
          entityType: true,
          entityId: true,
          newValue: true,
          createdAt: true,
        },
        ...pageArgs(query),
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return Paginated.of(
      rows.map((r) => {
        const v = details(r.newValue) ?? {};
        return {
          id: r.auditLogId,
          at: r.createdAt.toISOString(),
          kind: r.action === 'SEPAY_TRANSFER_LATE' ? 'LATE' : 'UNMATCHED',
          reason: str(v.reason),
          code: str(v.code),
          bookingId: r.entityType === 'booking' ? r.entityId : null,
          amount: typeof v.amount === 'number' ? v.amount : null,
          content: str(v.content),
          sepayId: str(v.sepayId),
        };
      }),
      { ...query, total },
    );
  }

  /** M10: read-only, from the server's environment; the secrets masked. */
  async settings(webhookUrl: string): Promise<PaymentSettings> {
    const get = <K extends keyof Env>(key: K) =>
      this.config.get(key, { infer: true });
    const account = get('SEPAY_ACCOUNT_NUMBER');
    return {
      provider: 'SEPAY',
      bank: { code: get('SEPAY_BANK_CODE'), name: get('SEPAY_BANK_NAME') },
      accountNumber: `****${account.slice(-4)}`,
      accountName: get('SEPAY_ACCOUNT_NAME'),
      webhookUrl,
      webhookKeySet: !!get('SEPAY_WEBHOOK_API_KEY'),
      lastWebhookAt: (await this.lastWebhook())?.toISOString() ?? null,
      paymentHoldMinutes: BOOKING_LIMITS.holdMinutes,
      walletHoldDays: get('WALLET_HOLD_DAYS'),
      defaultCommissionRate: get('DEFAULT_COMMISSION_RATE'),
    };
  }

  /** What can be checked without calling SePay: a real account, the webhook key, a recent notification. */
  async test(now = new Date()): Promise<PaymentSettingsCheck> {
    const account = this.config.get('SEPAY_ACCOUNT_NUMBER', { infer: true });
    const key = this.config.get('SEPAY_WEBHOOK_API_KEY', { infer: true });
    const last = await this.lastWebhook();
    const recent =
      !!last && now.getTime() - last.getTime() <= WEBHOOK_SILENCE_DAYS * DAY_MS;
    return {
      checks: [
        {
          name: 'ACCOUNT_CONFIGURED',
          ok: account !== DEMO_ACCOUNT,
          message:
            account === DEMO_ACCOUNT
              ? 'SEPAY_ACCOUNT_NUMBER is still the demo account'
              : null,
        },
        {
          name: 'WEBHOOK_KEY_SET',
          ok: !!key,
          message: key ? null : 'SEPAY_WEBHOOK_API_KEY is not set',
        },
        {
          name: 'WEBHOOK_RECEIVED',
          ok: recent,
          message: recent
            ? null
            : last
              ? `No SePay notification in the last ${WEBHOOK_SILENCE_DAYS} days`
              : 'No SePay notification received yet',
        },
      ],
    };
  }

  /** The latest event a SePay notification wrote: a confirmed transfer, or one that confirmed nothing or came late. */
  private async lastWebhook() {
    const last = await this.prisma.auditLog.findFirst({
      where: {
        OR: [
          {
            action: 'BOOKING_CONFIRMED',
            newValue: { contains: '"transactionId"' },
          },
          { action: { in: UNMATCHED } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });
    return last?.createdAt ?? null;
  }

  private where(
    query: Omit<AdminTransactionListQuery, 'page' | 'pageSize'>,
    now: Date,
  ) {
    const period = platformPeriod(query, todayInVietnam(now));
    const filters = [
      Prisma.sql`i.created_at >= ${vietnamDateTime(period.from, '00:00')}`,
      Prisma.sql`i.created_at < ${vietnamDateTime(addDays(period.to, 1), '00:00')}`,
    ];
    if (query.status) {
      filters.push(
        Prisma.sql`i.payment_status::text IN (${Prisma.join(query.status)})`,
      );
    }
    if (query.method) {
      filters.push(
        Prisma.sql`i.payment_method::text IN (${Prisma.join(query.method)})`,
      );
    }
    if (query.search) {
      const pattern = `%${escapeLike(query.search)}%`;
      filters.push(
        Prisma.sql`(i.invoice_number ILIKE ${pattern} OR i.vnpay_txn_ref ILIKE ${pattern})`,
      );
    }
    if (query.mismatch === 'true') filters.push(MISMATCH);
    if (query.mismatch === 'false') filters.push(Prisma.sql`NOT ${MISMATCH}`);
    return Prisma.join(filters, ' AND ');
  }
}
