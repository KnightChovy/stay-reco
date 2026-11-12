import type { LoyaltyEntry, LoyaltyTier, Voucher, WalletTxnType } from "@stayreco/shared";
import { formatMoney } from "@/features/stays/lib/format";

export const TIER_LABELS: Record<LoyaltyTier, string> = {
  MEMBER: "Thành viên",
  SILVER: "Bạc",
  GOLD: "Vàng",
  PLATINUM: "Bạch kim",
};

/** Lifetime points where each tier starts (docs/api/loyalty.md "Tiers"); only used to draw the progress bar. */
export const TIER_THRESHOLDS: Record<LoyaltyTier, number> = {
  MEMBER: 0,
  SILVER: 10_000,
  GOLD: 30_000,
  PLATINUM: 100_000,
};

export const LOYALTY_ENTRY_LABELS: Record<LoyaltyEntry["kind"], string> = {
  EARNED: "Tích điểm sau kỳ nghỉ",
  SPENT: "Dùng điểm khi đặt phòng",
  REFUNDED: "Hoàn điểm do đơn không diễn ra",
};

export const WALLET_TXN_LABELS: Record<WalletTxnType, string> = {
  BOOKING_PAYMENT: "Thanh toán đặt phòng",
  COMMISSION: "Hoa hồng",
  PAYOUT: "Rút tiền",
  REFUND: "Hoàn tiền huỷ phòng",
  TOPUP: "Nạp tiền",
  SETTLEMENT: "Tất toán",
  ADJUSTMENT: "Điều chỉnh",
};

const pointsFormat = new Intl.NumberFormat("vi-VN");

export function formatPoints(points: number) {
  return `${pointsFormat.format(points)} điểm`;
}

/** "Giảm 30%, tối đa 500.000 ₫" / "Giảm 200.000 ₫". */
export function describeVoucherDiscount(voucher: Pick<Voucher, "discountType" | "discountValue" | "maxDiscount">) {
  if (voucher.discountType === "PERCENTAGE") {
    const cap = voucher.maxDiscount != null ? `, tối đa ${formatMoney(voucher.maxDiscount)}` : "";
    return `Giảm ${voucher.discountValue}%${cap}`;
  }
  return `Giảm ${formatMoney(voucher.discountValue)}`;
}
