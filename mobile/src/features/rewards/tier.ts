import type { LoyaltyTier } from '@stayreco/shared';

export const tierLabel: Record<LoyaltyTier, string> = {
  MEMBER: 'Thành viên',
  SILVER: 'Bạc',
  GOLD: 'Vàng',
  PLATINUM: 'Bạch kim',
};

/** Ngưỡng điểm tích lũy của từng hạng, khớp docs/api/loyalty.md (backend giữ hằng số này). */
export const tierThreshold: Record<LoyaltyTier, number> = { MEMBER: 0, SILVER: 10_000, GOLD: 30_000, PLATINUM: 100_000 };
