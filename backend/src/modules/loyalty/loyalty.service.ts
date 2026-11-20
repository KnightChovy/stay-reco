import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  type HotelLoyaltyProgram,
  type HotelLoyaltyProgramInput,
  LOYALTY_LIMITS,
  type LoyaltyAccount,
  type LoyaltyEntry,
  type LoyaltyEntryQuery,
  type PointsQuote,
} from '@stayreco/shared';
import type { RequestMeta } from '../../common/decorators/request-meta.decorator';
import { ErrorCode } from '../../common/errors/error-code';
import { lockHotel } from '../../common/db/locks';
import { Paginated } from '../../common/http/api-response';
import { toNumber } from '../../common/http/decimal';
import { pageArgs } from '../../common/http/pagination';
import { type LoyaltyProgram, Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditAction, AuditService } from '../audit/audit.service';
import {
  earnRate,
  nextTier,
  pointsEarned,
  pointsToSpend,
  pointsValue,
  redeemCap,
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
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

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
   * What applies to a stay at a hotel (decisions L8–L10): the platform programme, with the hotel's own earning rate
   * and redemption conditions when it has switched them on. The value of a point is always the platform's, because
   * every point lands in the same balance. Null when no platform programme runs: then nothing is earned or spent.
   */
  private async rulesAt(
    tx: Prisma.TransactionClient | PrismaService,
    hotelId: string,
  ) {
    const programme = await this.programme(tx);
    if (!programme) return null;
    const own = await tx.loyaltyProgram.findUnique({ where: { hotelId } });
    const rules = own?.isActive ? own : programme;
    return {
      programme,
      pointsPerCurrency: earnRate(
        programme.pointsPerCurrency,
        own?.isActive ? own.pointsPerCurrency : null,
      ),
      acceptsPoints: rules.acceptsPoints,
      maxRedeemPercent: rules.maxRedeemPercent,
    };
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
   * How many of the points a customer asked to spend can actually be used on a stay at `hotelId`, and what they take
   * off. The hotel's redemption conditions apply (L10): none when it does not take points, otherwise at most its
   * share of the stay. Read-only: nothing is spent until the booking is created.
   */
  async quote(
    customerId: string,
    hotelId: string,
    payableAfterDiscount: Prisma.Decimal,
    pointsRequested: number,
  ): Promise<PointsQuote> {
    const rules = await this.rulesAt(this.prisma, hotelId);
    if (!rules) throw noProgramme();
    const { programme } = rules;
    const row = await this.openAccount(
      this.prisma,
      customerId,
      programme.loyaltyProgramId,
    );

    if (!rules.acceptsPoints && pointsRequested > 0) {
      throw new ConflictException({
        code: ErrorCode.LOYALTY_POINTS_NOT_ACCEPTED,
        message: 'This hotel does not take loyalty points',
        details: [
          { field: 'pointsToUse', message: 'not accepted at this hotel' },
        ],
      });
    }
    // What points may pay at this hotel: nothing when it does not take them, else its share of the stay.
    const cap = rules.acceptsPoints
      ? redeemCap(payableAfterDiscount, rules.maxRedeemPercent)
      : new Prisma.Decimal(0);
    const maxPointsUsable = pointsToSpend(
      row.pointsBalance,
      programme.pointValue,
      cap,
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
      cap,
    );
    return {
      programId: programme.loyaltyProgramId,
      pointsBalance: row.pointsBalance,
      maxPointsUsable,
      pointsUsed,
      amount: toNumber(pointsValue(pointsUsed, programme.pointValue, cap)),
      acceptsPoints: rules.acceptsPoints,
      maxRedeemPercent: toNumber(rules.maxRedeemPercent),
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
   * customer earns on money spent, so a discount lowers the points too (decision L3). The rate is the hotel's own
   * when it has switched its rules on, as they stand at check-out (L9), never above `LOYALTY_LIMITS`.
   */
  async earn(
    tx: Prisma.TransactionClient,
    {
      customerId,
      bookingId,
      hotelId,
      amountPaid,
    }: {
      customerId: string;
      bookingId: string;
      hotelId: string;
      amountPaid: Prisma.Decimal;
    },
  ) {
    const rules = await this.rulesAt(tx, hotelId);
    if (!rules) return 0;
    const points = pointsEarned(amountPaid, rules.pointsPerCurrency);
    if (points <= 0) return 0;

    const account = await this.openAccount(
      tx,
      customerId,
      rules.programme.loyaltyProgramId,
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

  /**
   * The platform programme a hotel's rules sit on, switched on or not, so a partner can still read and prepare its
   * rules while the platform has paused the programme.
   */
  private platform() {
    return this.prisma.loyaltyProgram.findFirst({
      where: { hotelId: null },
      orderBy: [{ isActive: 'desc' }, { createdAt: 'asc' }],
    });
  }

  /** `GET /hotels/:hotelId/loyalty-program`: the hotel's own rules, or the platform's while it has none. */
  async hotelProgram(hotelId: string): Promise<HotelLoyaltyProgram> {
    const platform = await this.platform();
    if (!platform) throw noProgramme();
    const own = await this.prisma.loyaltyProgram.findUnique({
      where: { hotelId },
    });
    return toHotelProgram(platform, own);
  }

  /**
   * `PUT /hotels/:hotelId/loyalty-program`: saves the hotel's own rules as a whole (L8–L10). The earning rate must sit
   * between the platform rate and `LOYALTY_LIMITS` times it (1x for now); the value of a point is copied from the platform and never set by
   * the hotel. One row per hotel (unique `hotel_id`), so two saves at once update the same row.
   */
  async saveHotelProgram(
    hotelId: string,
    input: HotelLoyaltyProgramInput,
    actorId: string,
    meta: RequestMeta,
  ): Promise<HotelLoyaltyProgram> {
    const platform = await this.platform();
    if (!platform) throw noProgramme();
    const rate = new Prisma.Decimal(input.pointsPerCurrency);
    const min = platform.pointsPerCurrency;
    const max = min.times(LOYALTY_LIMITS.maxEarnMultiplier);
    if (rate.lessThan(min) || rate.greaterThan(max)) {
      throw new BadRequestException({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Validation failed',
        details: [
          {
            field: 'pointsPerCurrency',
            // While the limit is 1x the only rate allowed is the platform's.
            message: min.equals(max)
              ? `must be ${min.toString()}, the platform rate`
              : `from ${min.toString()} to ${max.toString()}`,
          },
        ],
      });
    }

    const rules = {
      isActive: input.isActive,
      pointsPerCurrency: rate,
      acceptsPoints: input.acceptsPoints,
      maxRedeemPercent: new Prisma.Decimal(input.maxRedeemPercent),
    };
    // The hotel is locked so two saves at once run one after the other, and the audit log's `before` is the rules
    // the save really replaced.
    const { before, saved } = await this.prisma.$transaction(async (tx) => {
      await lockHotel(tx, hotelId);
      const before = await tx.loyaltyProgram.findUnique({
        where: { hotelId },
      });
      const saved = await tx.loyaltyProgram.upsert({
        where: { hotelId },
        create: {
          hotelId,
          name: `${platform.name} (hotel rules)`.slice(0, 200),
          // Not read back: a point is always worth the platform's value. Kept only because the column is required.
          pointValue: platform.pointValue,
          ...rules,
        },
        update: rules,
      });
      return { before, saved };
    });
    await this.audit.log(AuditAction.LOYALTY_PROGRAM_UPDATED, actorId, meta, {
      hotelId,
      before: before && snapshot(before),
      after: snapshot(saved),
    });
    return toHotelProgram(platform, saved);
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

/** What the audit log keeps of a hotel's rules before and after a change. */
function snapshot(row: LoyaltyProgram) {
  return {
    isActive: row.isActive,
    pointsPerCurrency: toNumber(row.pointsPerCurrency),
    acceptsPoints: row.acceptsPoints,
    maxRedeemPercent: toNumber(row.maxRedeemPercent),
  };
}

/** A hotel's rules as the partner reads them, with the platform programme and the bounds a save must respect. */
function toHotelProgram(
  platform: LoyaltyProgram,
  own: LoyaltyProgram | null,
): HotelLoyaltyProgram {
  const rules = own ?? platform;
  const base = platform.pointsPerCurrency;
  return {
    custom: own !== null,
    appliesNow: Boolean(own?.isActive) && platform.isActive,
    isActive: own?.isActive ?? false,
    pointsPerCurrency: toNumber(rules.pointsPerCurrency),
    earnMultiplier: base.isZero()
      ? 1
      : toNumber(
          rules.pointsPerCurrency
            .dividedBy(base)
            .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP),
        ),
    acceptsPoints: rules.acceptsPoints,
    maxRedeemPercent: toNumber(rules.maxRedeemPercent),
    platform: {
      name: platform.name,
      isActive: platform.isActive,
      pointsPerCurrency: toNumber(base),
      pointValue: toNumber(platform.pointValue),
    },
    limits: {
      minPointsPerCurrency: toNumber(base),
      maxPointsPerCurrency: toNumber(
        base.times(LOYALTY_LIMITS.maxEarnMultiplier),
      ),
      minRedeemPercent: LOYALTY_LIMITS.redeemPercent.min,
      maxRedeemPercent: LOYALTY_LIMITS.redeemPercent.max,
    },
  };
}
