import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  type CreatePricingRuleInput,
  type PricePreview,
  type PricePreviewQuery,
  type PricingRule,
  type PricingRuleListQuery,
  type PricingRuleShape,
  pricingRuleIssues,
  type UpdatePricingRuleInput,
} from '@stayreco/shared';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import { ErrorCode } from '../../common/errors/error-code';
import {
  addDays,
  fromCalendarDate,
  todayInVietnam,
} from '../../common/http/calendar-date';
import { toNumber } from '../../common/http/decimal';
import {
  type HotelAccessLevel,
  HotelAccessService,
  isUuid,
} from '../../common/hotel-access/hotel-access.service';
import type { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { roomTypeNotFound } from '../rooms/room-types.service';
import { basePriceWhere } from '../rooms/room.mapper';
import { PriceEngine, ruleOrder } from './price-engine';
import { toPricingRule, toRuleShape } from './pricing.mapper';

const pricingRuleNotFound = () =>
  new NotFoundException({
    code: ErrorCode.PRICING_RULE_NOT_FOUND,
    message: 'Pricing rule not found',
  });

/** Partners manage only SEASON / EARLY_BIRD / LAST_MINUTE rows; the BASE row belongs to the room type. */
const notBase = { ruleType: { not: 'BASE' } } satisfies Prisma.PriceWhereInput;

const withBasePrice = {
  prices: {
    where: basePriceWhere,
    take: 1,
    select: { pricePerNight: true },
  },
} satisfies Prisma.RoomTypeSelect;

/** Sent dates become `@db.Date` values; `null` clears the column and `undefined` leaves it as it is. */
const dateColumn = (date: string | null | undefined) =>
  date === undefined
    ? undefined
    : date === null
      ? null
      : fromCalendarDate(date);

/**
 * Pricing rules of a hotel's room types (UC64, money-rules §2) and the price preview. The rules between fields come
 * from the shared `pricingRuleIssues`; what needs the room type's base price is checked here.
 */
@Injectable()
export class PricingRulesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: HotelAccessService,
    private readonly engine: PriceEngine,
  ) {}

  /** `hotelId` was checked by `HotelAccessRequired`. Highest priority first, then the newest. */
  async list(
    hotelId: string,
    query: PricingRuleListQuery,
  ): Promise<PricingRule[]> {
    const rules = await this.prisma.price.findMany({
      where: {
        ...notBase,
        roomTypeId: query.roomTypeId,
        roomType: { hotelId },
      },
      orderBy: ruleOrder,
    });
    return rules.map(toPricingRule);
  }

  async create(
    hotelId: string,
    input: CreatePricingRuleInput,
  ): Promise<PricingRule> {
    const roomType = await this.prisma.roomType.findFirst({
      where: { roomTypeId: input.roomTypeId, hotelId },
      select: withBasePrice,
    });
    if (!roomType) throw roomTypeNotFound();
    assertValid(input, roomType.prices[0]?.pricePerNight ?? null);

    const { validFrom, validTo, ...fields } = input;
    const rule = await this.prisma.price.create({
      data: {
        ...fields,
        validFrom: dateColumn(validFrom),
        validTo: dateColumn(validTo),
      },
    });
    return toPricingRule(rule);
  }

  /** The merged rule is validated as a whole, so changing `ruleType` alone reports the fields it now needs. */
  async update(
    user: AuthUser,
    priceId: string,
    input: UpdatePricingRuleInput,
  ): Promise<PricingRule> {
    const { rule, basePrice } = await this.findForAccess(
      user,
      priceId,
      'owner',
    );
    assertValid({ ...toRuleShape(rule), ...input }, basePrice);

    const { validFrom, validTo, ...fields } = input;
    const updated = await this.prisma.price.update({
      where: { priceId },
      data: {
        ...fields,
        validFrom: dateColumn(validFrom),
        validTo: dateColumn(validTo),
      },
    });
    return toPricingRule(updated);
  }

  /** Booked prices are stored on the booking, so deleting a rule never changes them (BR-09). */
  async remove(user: AuthUser, priceId: string): Promise<void> {
    await this.findForAccess(user, priceId, 'owner');
    await this.prisma.price.delete({ where: { priceId } });
  }

  /** Price of one night, as if the stay started on `date` and was booked on `bookedOn` (today by default). */
  async preview(
    user: AuthUser,
    roomTypeId: string,
    query: PricePreviewQuery,
  ): Promise<PricePreview> {
    const roomType = isUuid(roomTypeId)
      ? await this.prisma.roomType.findUnique({
          where: { roomTypeId },
          select: { hotelId: true },
        })
      : null;
    await this.access.assertResource(
      user,
      roomType?.hotelId,
      'member',
      roomTypeNotFound,
    );

    const bookedOn = query.bookedOn ?? todayInVietnam();
    const quotes = await this.engine.quote(
      [roomTypeId],
      query.date,
      addDays(query.date, 1),
      bookedOn,
    );
    const quote = quotes.get(roomTypeId);
    // The API creates the base price with the room type; one inserted another way gets it by setting `basePrice`.
    if (!quote) {
      throw new NotFoundException({
        code: ErrorCode.ROOM_TYPE_NOT_FOUND,
        message: 'The room type has no base price',
      });
    }
    const [night] = quote.nights;
    return {
      date: query.date,
      bookedOn,
      basePrice: toNumber(quote.basePrice),
      rule: night.rule && { id: night.rule.priceId, name: night.rule.name },
      price: toNumber(night.price),
    };
  }

  /** Checks the caller's access to the rule's hotel; outsiders get PRICING_RULE_NOT_FOUND. */
  private async findForAccess(
    user: AuthUser,
    priceId: string,
    level: HotelAccessLevel,
  ) {
    const rule = isUuid(priceId)
      ? await this.prisma.price.findFirst({
          where: { priceId, ...notBase },
          include: {
            roomType: { select: { hotelId: true, ...withBasePrice } },
          },
        })
      : null;
    await this.access.assertResource(
      user,
      rule?.roomType.hotelId,
      level,
      pricingRuleNotFound,
    );
    const { roomType, ...row } = rule!;
    return { rule: row, basePrice: roomType.prices[0]?.pricePerNight ?? null };
  }
}

/**
 * Field rules, plus: an amount must leave a price above 0 at the current base price. A base price lowered later is
 * handled by the engine, which skips such a rule.
 */
function assertValid(rule: PricingRuleShape, basePrice: Prisma.Decimal | null) {
  const issues = pricingRuleIssues(rule);
  if (
    rule.adjustmentType === 'AMOUNT' &&
    basePrice?.plus(rule.adjustmentValue).lte(0)
  ) {
    issues.push({
      path: 'adjustmentValue',
      message: `the price would be 0 or less (base price ${basePrice.toNumber()})`,
    });
  }
  if (issues.length) {
    throw new BadRequestException({
      code: ErrorCode.VALIDATION_ERROR,
      message: 'Validation failed',
      details: issues.map(({ path, message }) => ({ field: path, message })),
    });
  }
}
