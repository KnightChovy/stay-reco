import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { lockAccount } from '../../common/db/locks';
import {
  addDays,
  todayInVietnam,
  vietnamDateTime,
} from '../../common/http/calendar-date';
import type { Env } from '../../config/env';
import { Prisma } from '../../generated/prisma/client';
import { voucherCode } from '../promotions/promotions.service';

/**
 * The platform's WELCOME campaign. A fixed id, like the platform wallet's, so it is found without a lookup column and
 * created on first use rather than by a migration (docs/design/onboarding-welcome-voucher.md, W4).
 */
export const WELCOME_PROMOTION_ID = '00000000-0000-4000-8000-000000000002';

const voucherInclude = { promotion: true } satisfies Prisma.VoucherInclude;
export type WelcomeVoucherRow = Prisma.VoucherGetPayload<{
  include: typeof voucherInclude;
}>;

/**
 * The welcome code a customer earns by finishing onboarding: one personal code under the platform's WELCOME campaign,
 * once per customer, ever (W4–W6).
 *
 * The campaign is the platform's (`hotel_id` null) and code-only, so it never applies to a stay by itself, and the
 * discount is capped at 8 % of the rooms and paid out of the commission like every platform discount
 * (money-rules §2.1, §5.4). Its terms come from the environment (W5); the voucher copies the percent and the cap when
 * it is issued, so changing them later affects only codes issued after the change.
 */
@Injectable()
export class WelcomeVoucherService {
  private readonly percent: Prisma.Decimal;
  private readonly maxDiscount: Prisma.Decimal;
  private readonly minBooking: Prisma.Decimal | null;
  private readonly days: number;

  constructor(config: ConfigService<Env, true>) {
    this.percent = new Prisma.Decimal(
      config.get('WELCOME_VOUCHER_PERCENT', { infer: true }),
    );
    this.maxDiscount = new Prisma.Decimal(
      config.get('WELCOME_VOUCHER_MAX_DISCOUNT', { infer: true }),
    );
    const min = config.get('WELCOME_VOUCHER_MIN_BOOKING', { infer: true });
    this.minBooking = min > 0 ? new Prisma.Decimal(min) : null;
    this.days = config.get('WELCOME_VOUCHER_DAYS', { infer: true });
  }

  /** The customer's welcome code, or null when they have none yet. */
  find(
    db: Prisma.TransactionClient,
    customerId: string,
  ): Promise<WelcomeVoucherRow | null> {
    return db.voucher.findFirst({
      where: { promotionId: WELCOME_PROMOTION_ID, customerId },
      include: voucherInclude,
    });
  }

  /**
   * Issues the customer's welcome code inside the caller's transaction, or answers the one they already have.
   *
   * The account is locked first, so two requests at once cannot both find no code and both issue one: "once per
   * customer" is a rule the schema has no constraint for. `issued` is false when the code already existed.
   */
  async issue(
    tx: Prisma.TransactionClient,
    customerId: string,
    now = new Date(),
  ): Promise<{ voucher: WelcomeVoucherRow; issued: boolean }> {
    await lockAccount(tx, customerId);
    const existing = await this.find(tx, customerId);
    if (existing) return { voucher: existing, issued: false };

    await this.ensureCampaign(tx);
    const lastDay = addDays(todayInVietnam(now), this.days - 1);
    const voucher = await tx.voucher.create({
      data: {
        promotionId: WELCOME_PROMOTION_ID,
        customerId,
        code: voucherCode(),
        discountType: 'PERCENTAGE',
        discountValue: this.percent,
        maxDiscount: this.maxDiscount,
        // The last instant of its last day in Vietnam, as for every voucher (money-rules §2.1).
        expiresAt: new Date(
          vietnamDateTime(addDays(lastDay, 1), '00:00').getTime() - 1,
        ),
      },
      include: voucherInclude,
    });
    return { voucher, issued: true };
  }

  /**
   * The WELCOME campaign, created on first use and kept to the current minimum stay. Switched on, code-only and
   * unlimited: each code is limited by being one per customer, not by a campaign counter.
   */
  private ensureCampaign(tx: Prisma.TransactionClient) {
    const terms = {
      discountType: 'PERCENTAGE' as const,
      discountValue: this.percent,
      minBookingAmount: this.minBooking,
      requiresCode: true,
      isActive: true,
    };
    return tx.promotion.upsert({
      where: { promotionId: WELCOME_PROMOTION_ID },
      create: {
        promotionId: WELCOME_PROMOTION_ID,
        hotelId: null,
        name: 'Quà chào mừng thành viên mới',
        description:
          'Mã giảm giá cho khách hàng vừa hoàn tất chọn sở thích lần đầu, dùng được ở mọi khách sạn trên StayReco.',
        ...terms,
      },
      update: terms,
    });
  }
}
