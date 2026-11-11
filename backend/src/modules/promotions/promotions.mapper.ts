import type { Promotion, Voucher } from '@stayreco/shared';
import { toCalendarDate } from '../../common/http/calendar-date';
import { toNumber } from '../../common/http/decimal';
import type { Prisma } from '../../generated/prisma/client';
import { campaignUsable } from './discount';

export type PromotionRow = Prisma.PromotionGetPayload<object>;

export type VoucherRow = Prisma.VoucherGetPayload<{
  include: { promotion: true };
}>;

export const toPromotion = (p: PromotionRow, today: string): Promotion => ({
  id: p.promotionId,
  hotelId: p.hotelId,
  name: p.name,
  description: p.description,
  discountType: p.discountType,
  discountValue: toNumber(p.discountValue),
  minBookingAmount: toNumber(p.minBookingAmount),
  maxUses: p.maxUses,
  currentUses: p.currentUses,
  validFrom: p.validFrom && toCalendarDate(p.validFrom),
  validTo: p.validTo && toCalendarDate(p.validTo),
  isActive: p.isActive,
  usable: campaignUsable(p, today),
  createdAt: p.createdAt.toISOString(),
});

/**
 * A voucher is usable when it has not been spent, has not expired, and the campaign behind it is still running: a
 * code the hotel switched off stops working even though the customer still holds it.
 */
export const toVoucher = (v: VoucherRow, today: string): Voucher => ({
  id: v.voucherId,
  code: v.code,
  promotionId: v.promotionId,
  promotionName: v.promotion.name,
  hotelId: v.promotion.hotelId,
  discountType: v.discountType,
  discountValue: toNumber(v.discountValue),
  maxDiscount: toNumber(v.maxDiscount),
  minBookingAmount: toNumber(v.promotion.minBookingAmount),
  usedAt: v.usedAt?.toISOString() ?? null,
  expiresAt: v.expiresAt?.toISOString() ?? null,
  usable:
    v.usedAt === null &&
    (v.expiresAt === null || v.expiresAt > new Date()) &&
    campaignUsable(v.promotion, today),
  createdAt: v.createdAt.toISOString(),
});
