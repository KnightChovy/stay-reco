import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  LoyaltyAccount,
  LoyaltyEntry,
  LoyaltyEntryQuery,
  PointsQuote,
} from '@stayreco/shared';
import { ErrorCode } from '../../common/errors/error-code';
import { Paginated } from '../../common/http/api-response';
import { toNumber } from '../../common/http/decimal';
import { pageArgs } from '../../common/http/pagination';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  nextTier,
  pointsEarned,
  pointsToSpend,
  pointsValue,
  tierFor,
} from './points';

/** Points movements are kept in the audit log, keyed by the loyalty account, instead of a table of their own. */
const ENTITY = 'loyalty_account';

export const LOYALTY_ACTIONS = {
  EARNED: 'LOYALTY_POINTS_EARNED',
  SPENT: 'LOYALTY_POINTS_SPENT',
  REFUNDED: 'LOYALTY_POINTS_REFUNDED',
} as const;

type MovementKind = keyof typeof LOYALTY_ACTIONS;

const noProgramme = () =>
  new NotFoundException({
    code: ErrorCode.LOYALTY_PROGRAM_NOT_FOUND,
    message: 'No loyalty programme is running',
  });

/**
 * The platform-wide loyalty programme (BR-11, decision L1). Points are earned on what a stay was actually paid, and
 * spent as the third subtraction of a later booking's price (money-rules §2.1): nightly prices, minus a promotion or
 * a voucher, minus the value of the points spent.
 *
 * Every movement is written to the audit log against the customer's loyalty account, so the history can be read back
 * without a table of its own, the way cancellation reasons and fees already are.
 */
@Injectable()
export class LoyaltyService {
  constructor(private readonly prisma: PrismaService) {}

  /** The one platform-wide programme, or nothing when the seed has not created it. */
  private programme(
    tx: Prisma.TransactionClient | PrismaService = this.prisma,
  ) {
    return tx.loyaltyProgram.findFirst({
      where: { hotelId: null, isActive: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * The customer's account, created on first read so a new customer sees a balance of 0 rather than an error. The
   * tier is recomputed from lifetime points on every read, so changing a threshold takes effect at once.
   */
  async account(customerId: string): Promise<LoyaltyAccount> {
    const programme = await this.programme();
    if (!programme) throw noProgramme();
    const row = await this.openAccount(
      this.prisma,
      customerId,
      programme.loyaltyProgramId,
    );

    const tier = tierFor(row.lifetimePoints);
    const value = toNumber(programme.pointValue);
    return {
      programId: programme.loyaltyProgramId,
      programName: programme.name,
      pointsBalance: row.pointsBalance,
      lifetimePoints: row.lifetimePoints,
      tier,
      nextTier: nextTier(row.lifetimePoints),
      pointValue: value,
      balanceValue: toNumber(
        programme.pointValue
          .times(row.pointsBalance)
          .toDecimalPlaces(0, Prisma.Decimal.ROUND_HALF_UP),
      ),
      joinedAt: row.joinedAt.toISOString(),
    };
  }

  /** The account row, opened if the customer has never had one. */
  private async openAccount(
    tx: Prisma.TransactionClient | PrismaService,
    customerId: string,
    loyaltyProgramId: string,
  ) {
    return tx.loyaltyAccount.upsert({
      where: {
        customerId_loyaltyProgramId: { customerId, loyaltyProgramId },
      },
      create: { customerId, loyaltyProgramId, tier: 'MEMBER' },
      update: {},
    });
  }

  /**
   * How many of the points a customer asked to spend can actually be used on a stay, and what they take off.
   * Read-only: nothing is spent until the booking is created.
   */
  async quote(
    customerId: string,
    payableAfterDiscount: Prisma.Decimal,
    pointsRequested: number,
  ): Promise<PointsQuote> {
    const programme = await this.programme();
    if (!programme) throw noProgramme();
    const row = await this.openAccount(
      this.prisma,
      customerId,
      programme.loyaltyProgramId,
    );

    const maxPointsUsable = pointsToSpend(
      row.pointsBalance,
      programme.pointValue,
      payableAfterDiscount,
    );
    if (pointsRequested > row.pointsBalance) {
      throw new ConflictException({
        code: ErrorCode.LOYALTY_POINTS_INSUFFICIENT,
        message: 'Not enough points',
        details: [
          { field: 'pointsToUse', message: `balance ${row.pointsBalance}` },
        ],
      });
    }
    const pointsUsed = pointsToSpend(
      pointsRequested,
      programme.pointValue,
      payableAfterDiscount,
    );
    return {
      programId: programme.loyaltyProgramId,
      pointsBalance: row.pointsBalance,
      maxPointsUsable,
      pointsUsed,
      amount: toNumber(
        pointsValue(pointsUsed, programme.pointValue, payableAfterDiscount),
      ),
    };
  }

  /**
   * Spends points on a booking, inside that booking's transaction. The balance is lowered conditionally, so two
   * bookings racing for the same points cannot both succeed; the loser is told its price changed.
   */
  async spend(
    tx: Prisma.TransactionClient,
    customerId: string,
    bookingId: string,
    points: number,
  ): Promise<boolean> {
    if (points <= 0) return true;
    const programme = await this.programme(tx);
    if (!programme) return false;
    const account = await this.openAccount(
      tx,
      customerId,
      programme.loyaltyProgramId,
    );

    const { count } = await tx.loyaltyAccount.updateMany({
      where: {
        loyaltyAccountId: account.loyaltyAccountId,
        pointsBalance: { gte: points },
      },
      data: { pointsBalance: { decrement: points } },
    });
    if (!count) return false;

    await this.record(
      tx,
      account.loyaltyAccountId,
      customerId,
      'SPENT',
      -points,
      bookingId,
    );
    return true;
  }

  /**
   * Credits the points of a completed stay, on what the booking was actually paid rather than on its list price: a
   * customer earns on money spent, so a discount lowers the points too (decision L3).
   */
  async earn(
    tx: Prisma.TransactionClient,
    customerId: string,
    bookingId: string,
    amountPaid: Prisma.Decimal,
  ) {
    const programme = await this.programme(tx);
    if (!programme) return 0;
    const points = pointsEarned(amountPaid, programme.pointsPerCurrency);
    if (points <= 0) return 0;

    const account = await this.openAccount(
      tx,
      customerId,
      programme.loyaltyProgramId,
    );
    const updated = await tx.loyaltyAccount.update({
      where: { loyaltyAccountId: account.loyaltyAccountId },
      data: {
        pointsBalance: { increment: points },
        lifetimePoints: { increment: points },
      },
    });
    // The tier is stored as well as computed, so other screens can read it without redoing the arithmetic.
    await tx.loyaltyAccount.update({
      where: { loyaltyAccountId: account.loyaltyAccountId },
      data: { tier: tierFor(updated.lifetimePoints) },
    });
    await this.record(
      tx,
      account.loyaltyAccountId,
      customerId,
      'EARNED',
      points,
      bookingId,
    );
    return points;
  }

  /**
   * Gives spent points back when a booking never becomes a stay. Read from the audit log rather than a column, and
   * guarded by the refund entry, so a second release cannot credit the points twice.
   */
  async refund(
    tx: Prisma.TransactionClient,
    bookingId: string,
  ): Promise<number> {
    const spent = await tx.auditLog.findFirst({
      where: {
        action: LOYALTY_ACTIONS.SPENT,
        entityType: ENTITY,
        newValue: { contains: `"bookingId":"${bookingId}"` },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (!spent?.customerId) return 0;
    const alreadyBack = await tx.auditLog.count({
      where: {
        action: LOYALTY_ACTIONS.REFUNDED,
        entityType: ENTITY,
        newValue: { contains: `"bookingId":"${bookingId}"` },
      },
    });
    if (alreadyBack) return 0;

    const points = Math.abs(
      (JSON.parse(spent.newValue ?? '{}') as { points?: number }).points ?? 0,
    );
    if (!points) return 0;

    await tx.loyaltyAccount.update({
      where: { loyaltyAccountId: spent.entityId! },
      data: { pointsBalance: { increment: points } },
    });
    await this.record(
      tx,
      spent.entityId!,
      spent.customerId,
      'REFUNDED',
      points,
      bookingId,
    );
    return points;
  }

  /** The customer's points movements, newest first, read back from the audit log. */
  async entries(
    customerId: string,
    query: LoyaltyEntryQuery,
  ): Promise<Paginated<LoyaltyEntry>> {
    const where = {
      customerId,
      entityType: ENTITY,
      action: { in: Object.values(LOYALTY_ACTIONS) },
    } satisfies Prisma.AuditLogWhereInput;
    const [rows, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { auditLogId: 'asc' }],
        ...pageArgs(query),
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    const bookingIds = rows
      .map(
        (r) =>
          (JSON.parse(r.newValue ?? '{}') as { bookingId?: string }).bookingId,
      )
      .filter((id): id is string => Boolean(id));
    const hotels = await this.hotelNames(bookingIds);

    return Paginated.of(
      rows.map((r) => {
        const value = JSON.parse(r.newValue ?? '{}') as {
          points?: number;
          bookingId?: string;
        };
        const kind = (Object.entries(LOYALTY_ACTIONS).find(
          ([, a]) => a === r.action,
        )?.[0] ?? 'EARNED') as MovementKind;
        return {
          at: r.createdAt.toISOString(),
          kind,
          points: value.points ?? 0,
          bookingId: value.bookingId ?? null,
          hotelName: value.bookingId
            ? (hotels.get(value.bookingId) ?? null)
            : null,
        };
      }),
      { ...query, total },
    );
  }

  /** The hotel each of those bookings was at, so the history can say where the points came from. */
  private async hotelNames(bookingIds: string[]): Promise<Map<string, string>> {
    if (!bookingIds.length) return new Map();
    const bookings = await this.prisma.booking.findMany({
      where: { bookingId: { in: bookingIds } },
      select: {
        bookingId: true,
        hotel: { select: { name: true } },
      },
    });
    return new Map(bookings.map((b) => [b.bookingId, b.hotel.name]));
  }

  /** One movement, written against the loyalty account so the history reads off the audit log's entity index. */
  private record(
    tx: Prisma.TransactionClient,
    loyaltyAccountId: string,
    customerId: string,
    kind: MovementKind,
    points: number,
    bookingId: string,
  ) {
    return tx.auditLog.create({
      data: {
        action: LOYALTY_ACTIONS[kind],
        customerId,
        entityType: ENTITY,
        entityId: loyaltyAccountId,
        newValue: JSON.stringify({ points, bookingId }),
      },
    });
  }
}
