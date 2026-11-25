import { randomUUID } from 'crypto';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  type CreatePayoutInput,
  type ManagerPayout,
  type ManagerPayoutListQuery,
  type Payout,
  type PayoutListQuery,
  type PayoutPaidInput,
  type PayoutRejectInput,
  type PayoutStatus,
} from '@stayreco/shared';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import type { RequestMeta } from '../../common/decorators/request-meta.decorator';
import { escapeLike } from '../../common/db/like';
import { lockWallet } from '../../common/db/locks';
import { FieldCipher } from '../../common/crypto/field-cipher';
import { ErrorCode } from '../../common/errors/error-code';
import { Paginated } from '../../common/http/api-response';
import { toNumber } from '../../common/http/decimal';
import { isUuid } from '../../common/hotel-access/hotel-access.service';
import type { Env } from '../../config/env';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditAction } from '../audit/audit.service';
import {
  beneficiaryAccount,
  mask,
  withBeneficiary,
} from '../verification/verification.mapper';
import { WalletLedger } from '../wallets/wallet-ledger';
import {
  ENTITY_TYPE,
  PAYOUT_EVENTS,
  type PaidValue,
  type PayoutActor,
  type PayoutEvent,
  type RejectedValue,
  type RequestedValue,
  STATUS_OF_EVENT,
  eventsOf,
  latestEventSql,
  payoutDueBy,
  recordPayoutEvent,
} from './payout-events';
import { PayoutMailer } from './payout-mailer';

const notFound = () =>
  new NotFoundException({
    code: ErrorCode.PAYOUT_NOT_FOUND,
    message: 'Withdrawal not found',
  });

const notPending = () =>
  new ConflictException({
    code: ErrorCode.PAYOUT_STATUS_CONFLICT,
    message: 'The withdrawal is no longer pending',
  });

const payoutSelect = {
  walletTransactionId: true,
  amount: true,
  createdAt: true,
  wallet: {
    select: {
      hotel: {
        select: {
          hotelId: true,
          name: true,
          hotelPartner: {
            select: { hotelPartnerId: true, partnerName: true, status: true },
          },
        },
      },
    },
  },
} satisfies Prisma.WalletTransactionSelect;
type PayoutRow = Prisma.WalletTransactionGetPayload<{
  select: typeof payoutSelect;
}>;

const eventSelect = {
  entityId: true,
  action: true,
  newValue: true,
  createdAt: true,
  platformManager: {
    select: {
      platformManagerId: true,
      userAccount: { select: { fullName: true } },
    },
  },
} satisfies Prisma.AuditLogSelect;
type EventRow = Prisma.AuditLogGetPayload<{ select: typeof eventSelect }>;

/** A withdrawal locked for a decision: the movement that reserved it and its positive amount. */
interface PendingPayout {
  id: string;
  walletId: string;
  amount: Prisma.Decimal;
}

/**
 * Withdrawals from a hotel wallet to the partner's bank account (UC59, UC74, BR-22, decisions M1–M3). No table: the
 * request is a `PAYOUT` movement that moves the amount from available to reserved, its state the latest of its audit
 * events. Every change locks the wallet row first, so one pending request per hotel, the available balance and the
 * "still pending" check hold when the partner, the manager or two requests act at the same time.
 */
@Injectable()
export class PayoutsService {
  private readonly cipher: FieldCipher;

  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: WalletLedger,
    private readonly mailer: PayoutMailer,
    config: ConfigService<Env, true>,
  ) {
    this.cipher = new FieldCipher(
      config.get('BENEFICIARY_ENCRYPTION_KEY', { infer: true }),
    );
  }

  /** The owner, not while suspended (checked by `HotelAccessRequired('owner')`). */
  async request(
    user: AuthUser,
    hotelId: string,
    input: CreatePayoutInput,
    meta: RequestMeta,
  ): Promise<Payout> {
    const id = randomUUID();
    await this.prisma.$transaction(async (tx) => {
      const { walletId } = await this.ledger.hotelWallet(tx, hotelId);
      await lockWallet(tx, walletId);

      if (await this.hasPending(tx, walletId)) {
        throw new ConflictException({
          code: ErrorCode.PAYOUT_PENDING,
          message: 'The hotel already has a withdrawal waiting',
        });
      }
      const verification = await tx.hotelVerificationRequest.findFirst({
        where: { hotelId, status: 'APPROVED', ...withBeneficiary },
        orderBy: [{ reviewedAt: 'desc' }, { createdAt: 'desc' }],
        select: {
          verificationRequestId: true,
          hotelProperties: {
            where: { propertyKey: { startsWith: 'beneficiary.' } },
            select: { propertyKey: true, propertyValue: true },
          },
        },
      });
      if (!verification) {
        throw new ConflictException({
          code: ErrorCode.BENEFICIARY_MISSING,
          message: 'The hotel has no approved beneficiary account',
        });
      }
      const wallet = await tx.wallet.findUniqueOrThrow({
        where: { walletId },
        select: { balanceAvailable: true },
      });
      const amount = new Prisma.Decimal(input.amount);
      if (amount.greaterThan(wallet.balanceAvailable)) {
        throw new ConflictException({
          code: ErrorCode.PAYOUT_EXCEEDS_BALANCE,
          message: 'The amount is more than the available balance',
          details: [
            { field: 'amount', message: wallet.balanceAvailable.toString() },
          ],
        });
      }

      const account = beneficiaryAccount(
        verification.hotelProperties,
        this.cipher,
      );
      await this.ledger.post(tx, {
        id,
        walletId,
        type: 'PAYOUT',
        amount: amount.negated(),
        balance: 'available',
        reserved: amount,
        idempotencyKey: `payout:${id}`,
        description: `Withdrawal to ${account.bankName} ${mask(account.accountNumber)}`,
      });
      await recordPayoutEvent(tx, {
        action: AuditAction.PAYOUT_REQUESTED,
        payoutId: id,
        actor: { role: 'HOTEL_PARTNER', accountId: user.accountId },
        value: {
          hotelId,
          amount: input.amount,
          verificationRequestId: verification.verificationRequestId,
        } satisfies RequestedValue,
        ip: meta.ip,
      });
    });
    return this.partnerView(id);
  }

  /** The owner, also while suspended: the amount goes back to the available balance. */
  async cancel(
    user: AuthUser,
    hotelId: string,
    payoutId: string,
    meta: RequestMeta,
  ): Promise<Payout> {
    await this.decide(payoutId, hotelId, (tx, payout) =>
      this.giveBack(tx, payout, {
        action: AuditAction.PAYOUT_CANCELLED,
        actor: { role: 'HOTEL_PARTNER', accountId: user.accountId },
        description: 'Withdrawal cancelled: amount returned',
        ip: meta.ip,
      }),
    );
    return this.partnerView(payoutId);
  }

  /** A hotel's withdrawals, newest first. */
  async listForHotel(
    hotelId: string,
    query: PayoutListQuery,
  ): Promise<Paginated<Payout>> {
    const { ids, total } = await this.page(
      Prisma.sql`w.hotel_id = ${hotelId}::uuid`,
      query.status ?? [],
      false,
      query,
    );
    const views = await this.views(ids, false);
    return Paginated.of(views.map(toPartnerView), { ...query, total });
  }

  /** The manager queue: PENDING oldest first by default; any other selection newest first. */
  async queue(
    query: ManagerPayoutListQuery,
  ): Promise<Paginated<ManagerPayout>> {
    const statuses = query.status ?? ['PENDING'];
    const filters = [Prisma.sql`TRUE`];
    if (query.hotelId) {
      filters.push(Prisma.sql`w.hotel_id = ${query.hotelId}::uuid`);
    }
    if (query.search) {
      const pattern = `%${escapeLike(query.search)}%`;
      filters.push(
        Prisma.sql`(h.name ILIKE ${pattern} OR hp.partner_name ILIKE ${pattern})`,
      );
    }
    const oldestFirst = statuses.length === 1 && statuses[0] === 'PENDING';
    const { ids, total } = await this.page(
      Prisma.join(filters, ' AND '),
      statuses,
      oldestFirst,
      query,
    );
    return Paginated.of(await this.views(ids, false), { ...query, total });
  }

  /** The full account number to transfer to; each opening is audited (M3). */
  async detail(
    user: AuthUser,
    payoutId: string,
    meta: RequestMeta,
  ): Promise<ManagerPayout> {
    const [view] = isUuid(payoutId) ? await this.views([payoutId], true) : [];
    if (!view) throw notFound();
    await recordPayoutEvent(this.prisma, {
      action: AuditAction.PAYOUT_ACCOUNT_VIEWED,
      payoutId,
      actor: { role: 'PLATFORM_MANAGER', accountId: user.accountId },
      ip: meta.ip,
    });
    return view;
  }

  /** The manager made the bank transfer: the reserved amount leaves the wallet, the money left the bank account. */
  async markPaid(
    user: AuthUser,
    payoutId: string,
    input: PayoutPaidInput,
    meta: RequestMeta,
  ): Promise<ManagerPayout> {
    await this.decide(payoutId, null, async (tx, payout) => {
      await tx.wallet.update({
        where: { walletId: payout.walletId },
        data: { balanceReserved: { decrement: payout.amount } },
      });
      await recordPayoutEvent(tx, {
        action: AuditAction.PAYOUT_PAID,
        payoutId,
        actor: { role: 'PLATFORM_MANAGER', accountId: user.accountId },
        value: { bankReference: input.bankReference } satisfies PaidValue,
        ip: meta.ip,
      });
    });
    this.mailer.paid(payoutId, input.bankReference);
    return this.managerView(payoutId);
  }

  async reject(
    user: AuthUser,
    payoutId: string,
    input: PayoutRejectInput,
    meta: RequestMeta,
  ): Promise<ManagerPayout> {
    await this.decide(payoutId, null, (tx, payout) =>
      this.giveBack(tx, payout, {
        action: AuditAction.PAYOUT_REJECTED,
        actor: { role: 'PLATFORM_MANAGER', accountId: user.accountId },
        value: { reason: input.reason },
        description: 'Withdrawal rejected: amount returned',
        ip: meta.ip,
      }),
    );
    this.mailer.rejected(payoutId, input.reason);
    return this.managerView(payoutId);
  }

  /** One withdrawal as its hotel's owner sees it (account masked). */
  async partnerView(payoutId: string): Promise<Payout> {
    const [view] = await this.views([payoutId], false);
    if (!view) throw notFound();
    return toPartnerView(view);
  }

  private async managerView(payoutId: string): Promise<ManagerPayout> {
    const [view] = await this.views([payoutId], false);
    if (!view) throw notFound();
    return view;
  }

  /**
   * Runs `apply` on a withdrawal that is still pending, with its wallet locked; `hotelId` limits it to one hotel
   * (the partner's routes), so another hotel's withdrawal is not found.
   */
  private async decide(
    payoutId: string,
    hotelId: string | null,
    apply: (
      tx: Prisma.TransactionClient,
      payout: PendingPayout,
    ) => Promise<unknown>,
  ) {
    if (!isUuid(payoutId)) throw notFound();
    await this.prisma.$transaction(async (tx) => {
      const row = await tx.walletTransaction.findFirst({
        where: {
          walletTransactionId: payoutId,
          type: 'PAYOUT',
          ...(hotelId && { wallet: { hotelId } }),
        },
        select: {
          walletId: true,
          amount: true,
          wallet: { select: { hotelId: true } },
        },
      });
      if (!row?.wallet.hotelId) throw notFound();
      await lockWallet(tx, row.walletId);
      const latest = await tx.auditLog.findFirst({
        where: {
          entityType: ENTITY_TYPE,
          entityId: payoutId,
          action: { in: PAYOUT_EVENTS },
        },
        orderBy: [{ createdAt: 'desc' }, { auditLogId: 'desc' }],
        select: { action: true },
      });
      if (latest?.action !== AuditAction.PAYOUT_REQUESTED) throw notPending();
      await apply(tx, {
        id: payoutId,
        walletId: row.walletId,
        amount: row.amount.negated(),
      });
    });
  }

  /** Rejected or cancelled: reserved −X, available +X, as an `ADJUSTMENT` of +X. */
  private async giveBack(
    tx: Prisma.TransactionClient,
    payout: PendingPayout,
    event: {
      action: AuditAction.PAYOUT_REJECTED | AuditAction.PAYOUT_CANCELLED;
      actor: PayoutActor;
      value?: RejectedValue;
      description: string;
      ip?: string;
    },
  ) {
    await this.ledger.post(tx, {
      walletId: payout.walletId,
      type: 'ADJUSTMENT',
      amount: payout.amount,
      balance: 'available',
      reserved: payout.amount.negated(),
      idempotencyKey: `payout:${payout.id}:return`,
      platformManagerId:
        event.actor.role === 'PLATFORM_MANAGER'
          ? event.actor.accountId
          : undefined,
      description: event.description,
    });
    await recordPayoutEvent(tx, {
      action: event.action,
      payoutId: payout.id,
      actor: event.actor,
      value: event.value,
      ip: event.ip,
    });
  }

  private async hasPending(tx: Prisma.TransactionClient, walletId: string) {
    const [{ n }] = await tx.$queryRaw<{ n: number }[]>`
      SELECT count(*)::int AS n FROM wallet_transaction wt
      WHERE wt.wallet_id = ${walletId}::uuid AND wt.type = 'PAYOUT'
        AND ${latestEventSql} = ${AuditAction.PAYOUT_REQUESTED}`;
    return n > 0;
  }

  /** One page of withdrawal ids in the given states, filtered by `where` over `w` (wallet), `h` (hotel), `hp`. */
  private async page(
    where: Prisma.Sql,
    statuses: readonly PayoutStatus[],
    oldestFirst: boolean,
    { page, pageSize }: { page: number; pageSize: number },
  ) {
    const actions = eventsOf(
      statuses.length ? statuses : ['PENDING', 'PAID', 'REJECTED', 'CANCELLED'],
    );
    const from = Prisma.sql`
      FROM wallet_transaction wt
      JOIN wallet w ON w.wallet_id = wt.wallet_id
      JOIN hotel h ON h.hotel_id = w.hotel_id
      JOIN hotel_partner hp ON hp.hotel_partner_id = h.hotel_partner_id
      WHERE wt.type = 'PAYOUT' AND ${where} AND ${latestEventSql} IN (${Prisma.join(actions)})`;
    const order = oldestFirst ? Prisma.sql`ASC` : Prisma.sql`DESC`;
    const [rows, [{ total }]] = await Promise.all([
      this.prisma.$queryRaw<{ id: string }[]>`
        SELECT wt.wallet_transaction_id AS id ${from}
        ORDER BY wt.created_at ${order}, wt.wallet_transaction_id
        LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`,
      this.prisma.$queryRaw<
        { total: number }[]
      >`SELECT count(*)::int AS total ${from}`,
    ]);
    return { ids: rows.map((r) => r.id), total };
  }

  /** The withdrawals `ids` in that order, with their events and beneficiary accounts. */
  private async views(
    ids: string[],
    fullAccount: boolean,
  ): Promise<ManagerPayout[]> {
    if (!ids.length) return [];
    const [rows, events] = await Promise.all([
      this.prisma.walletTransaction.findMany({
        where: { walletTransactionId: { in: ids }, type: 'PAYOUT' },
        select: payoutSelect,
      }),
      this.prisma.auditLog.findMany({
        where: {
          entityType: ENTITY_TYPE,
          entityId: { in: ids },
          action: { in: PAYOUT_EVENTS },
        },
        orderBy: [{ createdAt: 'asc' }, { auditLogId: 'asc' }],
        select: eventSelect,
      }),
    ]);
    const requests = new Map(
      events
        .filter((e) => e.action === (AuditAction.PAYOUT_REQUESTED as string))
        .map((e) => [e.entityId!, JSON.parse(e.newValue!) as RequestedValue]),
    );
    const properties = await this.prisma.hotelProperties.findMany({
      where: {
        verificationRequestId: {
          in: [...requests.values()].map((r) => r.verificationRequestId),
        },
        propertyKey: { startsWith: 'beneficiary.' },
      },
      select: {
        verificationRequestId: true,
        propertyKey: true,
        propertyValue: true,
      },
    });

    const byId = new Map(rows.map((r) => [r.walletTransactionId, r]));
    const now = new Date();
    return ids.flatMap((id) => {
      const row = byId.get(id);
      const request = requests.get(id);
      if (!row || !request) return [];
      const account = beneficiaryAccount(
        properties.filter(
          (p) => p.verificationRequestId === request.verificationRequestId,
        ),
        this.cipher,
      );
      return [
        toManagerView(
          row,
          events.filter((e) => e.entityId === id),
          fullAccount
            ? account
            : { ...account, accountNumber: mask(account.accountNumber) },
          now,
        ),
      ];
    });
  }
}

function toManagerView(
  row: PayoutRow,
  events: EventRow[],
  beneficiary: ManagerPayout['beneficiary'],
  now: Date,
): ManagerPayout {
  const hotel = row.wallet.hotel!;
  const last = events[events.length - 1];
  const status = STATUS_OF_EVENT[last.action as PayoutEvent];
  const decision = status === 'PENDING' ? null : last;
  const value = decision?.newValue
    ? (JSON.parse(decision.newValue) as Partial<PaidValue & RejectedValue>)
    : {};
  const dueBy = payoutDueBy(row.createdAt);
  return {
    id: row.walletTransactionId,
    hotel: { id: hotel.hotelId, name: hotel.name },
    amount: toNumber(row.amount.negated()),
    status,
    beneficiary,
    requestedAt: row.createdAt.toISOString(),
    dueBy: dueBy.toISOString(),
    overdue: status === 'PENDING' && now > dueBy,
    decidedAt: decision?.createdAt.toISOString() ?? null,
    bankReference: value.bankReference ?? null,
    reason: value.reason ?? null,
    partner: {
      id: hotel.hotelPartner.hotelPartnerId,
      name: hotel.hotelPartner.partnerName,
      status: hotel.hotelPartner.status,
    },
    decidedBy: decision?.platformManager
      ? {
          id: decision.platformManager.platformManagerId,
          fullName: decision.platformManager.userAccount.fullName,
        }
      : null,
  };
}

/** The partner's view has neither the partner nor the manager who decided. */
const toPartnerView = (v: ManagerPayout): Payout => ({
  id: v.id,
  hotel: v.hotel,
  amount: v.amount,
  status: v.status,
  beneficiary: v.beneficiary,
  requestedAt: v.requestedAt,
  dueBy: v.dueBy,
  overdue: v.overdue,
  decidedAt: v.decidedAt,
  bankReference: v.bankReference,
  reason: v.reason,
});
