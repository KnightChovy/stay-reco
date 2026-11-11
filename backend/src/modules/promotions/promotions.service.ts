import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  CreatePromotionInput,
  IssueVouchersInput,
  Promotion,
  PromotionListQuery,
  UpdatePromotionInput,
  Voucher,
} from '@stayreco/shared';
import { randomBytes } from 'crypto';
import type { AuthUser } from '../../common/decorators/current-user.decorator';
import type { RequestMeta } from '../../common/decorators/request-meta.decorator';
import { ErrorCode } from '../../common/errors/error-code';
import {
  HotelAccessService,
  isUuid,
} from '../../common/hotel-access/hotel-access.service';
import { Paginated } from '../../common/http/api-response';
import {
  fromCalendarDate,
  todayInVietnam,
} from '../../common/http/calendar-date';
import { pageArgs } from '../../common/http/pagination';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditAction, AuditService } from '../audit/audit.service';
import { campaignUsable } from './discount';
import { toPromotion, toVoucher } from './promotions.mapper';

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 10;

const promotionNotFound = () =>
  new NotFoundException({
    code: ErrorCode.PROMOTION_NOT_FOUND,
    message: 'Promotion not found',
  });

/**
 * Campaigns a hotel runs, and the personal codes handed out under them (BR-06).
 *
 * A `Promotion` is the campaign: it applies to a stay by itself, with no code typed. A `Voucher` is one customer's
 * personal code under a campaign, with its own cap and expiry. A booking takes one or the other, never both; which
 * one it takes is decided in `DiscountService`.
 */
@Injectable()
export class PromotionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: HotelAccessService,
    private readonly audit: AuditService,
  ) {}

  /** The hotel's campaigns, newest first; `active=true` keeps the ones a booking could use today. */
  async list(
    hotelId: string,
    query: PromotionListQuery,
  ): Promise<Paginated<Promotion>> {
    const today = todayInVietnam();
    const where = { hotelId } satisfies Prisma.PromotionWhereInput;
    const [rows, total] = await Promise.all([
      this.prisma.promotion.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }, { promotionId: 'asc' }],
        ...pageArgs(query),
      }),
      this.prisma.promotion.count({ where }),
    ]);
    const mapped = rows.map((p) => toPromotion(p, today));
    // `usable` is computed, not a column, so an `active` filter has to be applied after the rows are mapped.
    const kept = query.active ? mapped.filter((p) => p.usable) : mapped;
    return Paginated.of(kept, {
      ...query,
      total: query.active ? kept.length : total,
    });
  }

  async create(
    hotelId: string,
    input: CreatePromotionInput,
    actorId: string,
    meta: RequestMeta = {},
  ): Promise<Promotion> {
    const promotion = await this.prisma.promotion.create({
      data: {
        hotelId,
        name: input.name,
        description: input.description ?? null,
        discountType: input.discountType,
        discountValue: new Prisma.Decimal(input.discountValue),
        minBookingAmount:
          input.minBookingAmount === undefined
            ? null
            : new Prisma.Decimal(input.minBookingAmount),
        maxUses: input.maxUses ?? null,
        validFrom: input.validFrom ? fromCalendarDate(input.validFrom) : null,
        validTo: input.validTo ? fromCalendarDate(input.validTo) : null,
        isActive: input.isActive ?? true,
      },
    });
    await this.audit.log(AuditAction.PROMOTION_CREATED, actorId, meta, {
      promotionId: promotion.promotionId,
      hotelId,
      name: input.name,
    });
    return toPromotion(promotion, todayInVietnam());
  }

  /**
   * Changes a campaign. `currentUses` is never touched here: the bookings that already took the discount keep it,
   * and lowering `maxUses` below them simply stops the campaign rather than rewriting history.
   */
  async update(
    user: AuthUser,
    promotionId: string,
    input: UpdatePromotionInput,
    meta: RequestMeta = {},
  ): Promise<Promotion> {
    await this.ownedPromotion(user, promotionId);
    const promotion = await this.prisma.promotion.update({
      where: { promotionId },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.description !== undefined && {
          description: input.description,
        }),
        ...(input.discountType !== undefined && {
          discountType: input.discountType,
        }),
        ...(input.discountValue !== undefined && {
          discountValue: new Prisma.Decimal(input.discountValue),
        }),
        ...(input.minBookingAmount !== undefined && {
          minBookingAmount: new Prisma.Decimal(input.minBookingAmount),
        }),
        ...(input.maxUses !== undefined && { maxUses: input.maxUses }),
        ...(input.validFrom !== undefined && {
          validFrom: fromCalendarDate(input.validFrom),
        }),
        ...(input.validTo !== undefined && {
          validTo: fromCalendarDate(input.validTo),
        }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
      },
    });
    await this.audit.log(AuditAction.PROMOTION_UPDATED, user.accountId, meta, {
      promotionId,
      changed: Object.keys(input),
    });
    return toPromotion(promotion, todayInVietnam());
  }

  /**
   * Switches a campaign off. It is never deleted: bookings point at it through `booking.promotion_id`, and the
   * discounts already given have to stay readable.
   */
  async deactivate(
    user: AuthUser,
    promotionId: string,
    meta: RequestMeta = {},
  ): Promise<Promotion> {
    await this.ownedPromotion(user, promotionId);
    const promotion = await this.prisma.promotion.update({
      where: { promotionId },
      data: { isActive: false },
    });
    await this.audit.log(AuditAction.PROMOTION_UPDATED, user.accountId, meta, {
      promotionId,
      changed: ['isActive'],
      isActive: false,
    });
    return toPromotion(promotion, todayInVietnam());
  }

  /** Hands a personal code to each customer of a campaign, under the campaign's own terms. */
  async issueVouchers(
    user: AuthUser,
    promotionId: string,
    input: IssueVouchersInput,
    meta: RequestMeta = {},
  ): Promise<Voucher[]> {
    const promotion = await this.ownedPromotion(user, promotionId);
    if (!campaignUsable(promotion, todayInVietnam())) {
      throw new ConflictException({
        code: ErrorCode.PROMOTION_NOT_ACTIVE,
        message: 'The campaign is switched off, out of dates or out of uses',
      });
    }
    const customers = await this.prisma.customer.findMany({
      where: { customerId: { in: input.customerIds } },
      select: { customerId: true },
    });
    if (customers.length !== new Set(input.customerIds).size) {
      throw new NotFoundException({
        code: ErrorCode.NOT_FOUND,
        message: 'One of the customers does not exist',
      });
    }

    const vouchers = await this.prisma.$transaction(
      async (tx) =>
        await Promise.all(
          customers.map(({ customerId }) =>
            tx.voucher.create({
              data: {
                promotionId,
                customerId,
                code: voucherCode(),
                discountType: promotion.discountType,
                discountValue: promotion.discountValue,
                maxDiscount:
                  input.maxDiscount === undefined
                    ? null
                    : new Prisma.Decimal(input.maxDiscount),
                expiresAt: input.expiresAt
                  ? fromCalendarDate(input.expiresAt)
                  : null,
              },
              include: { promotion: true },
            }),
          ),
        ),
    );
    await this.audit.log(AuditAction.VOUCHERS_ISSUED, user.accountId, meta, {
      promotionId,
      count: vouchers.length,
    });
    const today = todayInVietnam();
    return vouchers.map((v) => toVoucher(v, today));
  }

  /** The signed-in customer's codes, the spent and expired ones included, newest first. */
  async listMine(customerId: string, query: PromotionListQuery) {
    const today = todayInVietnam();
    const where = { customerId } satisfies Prisma.VoucherWhereInput;
    const [rows, total] = await Promise.all([
      this.prisma.voucher.findMany({
        where,
        include: { promotion: true },
        orderBy: [{ createdAt: 'desc' }, { voucherId: 'asc' }],
        ...pageArgs(query),
      }),
      this.prisma.voucher.count({ where }),
    ]);
    const mapped = rows.map((v) => toVoucher(v, today));
    const kept = query.active ? mapped.filter((v) => v.usable) : mapped;
    return Paginated.of(kept, {
      ...query,
      total: query.active ? kept.length : total,
    });
  }

  /** The campaign, checked to belong to a hotel the caller may change. */
  private async ownedPromotion(user: AuthUser, promotionId: string) {
    const promotion = isUuid(promotionId)
      ? await this.prisma.promotion.findUnique({ where: { promotionId } })
      : null;
    await this.access.assertResource(
      user,
      promotion?.hotelId ?? undefined,
      'owner',
      promotionNotFound,
    );
    return promotion!;
  }
}

/**
 * A code a person can read out over the phone: no lowercase, and no 0/O or 1/I to mistype. 32^10 is far beyond what
 * a hotel will ever issue, and the unique column catches a clash anyway.
 */
function voucherCode(): string {
  const bytes = randomBytes(CODE_LENGTH);
  let code = '';
  for (const byte of bytes) code += CODE_ALPHABET[byte % CODE_ALPHABET.length];
  return code;
}
