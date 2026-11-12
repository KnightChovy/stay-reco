import { api } from "@/lib/axios";
import type {
  CreateReviewInput,
  CustomerWallet,
  DiscountQuote,
  DiscountQuoteInput,
  LoyaltyAccount,
  LoyaltyEntry,
  RatingCriterion,
  RatingSummary,
  Review,
  ReviewEligibility,
  ReviewListQuery,
  UpdateReviewInput,
  Voucher,
  WalletTransaction,
  WalletTxnType,
} from "@stayreco/shared";
import type { APIResponse, PageMeta } from "@/types/response.type";

/**
 * Customer endpoints of phase 4 (docs/phases/phase-4-loyalty-promotions.md): discounts on a stay
 * (docs/api/promotions.md), StayMiles points (docs/api/loyalty.md), the customer wallet and preferences
 * (docs/api/customer-wallet.md) and post-stay reviews (docs/api/reviews.md).
 */

export type PageParams = { page?: number; pageSize?: number };

// ── Discounts ───────────────────────────────────────────────

/** What a stay costs with the automatic campaign or a typed code, and the points; holds and spends nothing. */
export async function getDiscountQuote(input: DiscountQuoteInput) {
  const { data } = await api.post<APIResponse<DiscountQuote>>("/bookings/discount-quote", input);
  return data.data;
}

export async function getMyVouchers(params: PageParams & { active?: boolean } = {}) {
  const { data } = await api.get<APIResponse<Voucher[]>>("/me/vouchers", { params });
  return { vouchers: data.data, meta: data.meta as PageMeta };
}

// ── Loyalty ─────────────────────────────────────────────────

/** Opened on first read, so a customer who never earned anything gets a balance of 0. */
export async function getMyLoyalty() {
  const { data } = await api.get<APIResponse<LoyaltyAccount>>("/me/loyalty");
  return data.data;
}

export async function getMyLoyaltyEntries(params: PageParams = {}) {
  const { data } = await api.get<APIResponse<LoyaltyEntry[]>>("/me/loyalty/entries", { params });
  return { entries: data.data, meta: data.meta as PageMeta };
}

// ── Wallet ──────────────────────────────────────────────────

export async function getMyWallet() {
  const { data } = await api.get<APIResponse<CustomerWallet>>("/me/wallet");
  return data.data;
}

export type WalletTransactionParams = PageParams & { type?: WalletTxnType[]; from?: string; to?: string };

export async function getMyWalletTransactions(params: WalletTransactionParams = {}) {
  const { data } = await api.get<APIResponse<WalletTransaction[]>>("/me/wallet/transactions", {
    params,
    // `type` is a repeated query key (`?type=REFUND&type=BOOKING_PAYMENT`).
    paramsSerializer: { indexes: null },
  });
  return { transactions: data.data, meta: data.meta as PageMeta };
}

/** All or nothing (decision W1): 204, then the booking reads CONFIRMED. */
export async function payWithWallet(bookingId: string) {
  await api.post(`/bookings/${bookingId}/pay-with-wallet`);
}

// ── Preferences ─────────────────────────────────────────────

export type Preferences = Record<string, string>;

export async function getMyPreferences() {
  const { data } = await api.get<APIResponse<{ preferences: Preferences }>>("/me/preferences");
  return data.data.preferences;
}

/** Writes the given keys, removes those set to `null`, leaves the others alone. */
export async function updateMyPreferences(preferences: Record<string, string | null>) {
  const { data } = await api.put<APIResponse<{ preferences: Preferences }>>("/me/preferences", { preferences });
  return data.data.preferences;
}

// ── Reviews ─────────────────────────────────────────────────

export async function getRatingCriteria() {
  const { data } = await api.get<APIResponse<RatingCriterion[]>>("/rating-criteria");
  return data.data;
}

export async function getHotelReviews(hotelId: string, params: Partial<ReviewListQuery> = {}) {
  const { data } = await api.get<APIResponse<Review[]>>(`/hotels/${hotelId}/reviews`, { params });
  return { reviews: data.data, meta: data.meta as PageMeta };
}

export async function getHotelRatingSummary(hotelId: string) {
  const { data } = await api.get<APIResponse<RatingSummary>>(`/hotels/${hotelId}/rating-summary`);
  return data.data;
}

export async function getReviewEligibility(bookingId: string) {
  const { data } = await api.get<APIResponse<ReviewEligibility>>(`/bookings/${bookingId}/review-eligibility`);
  return data.data;
}

export async function createReview(bookingId: string, input: CreateReviewInput) {
  const { data } = await api.post<APIResponse<Review>>(`/bookings/${bookingId}/reviews`, input);
  return data.data;
}

export async function getMyReviews(params: Partial<ReviewListQuery> = {}) {
  const { data } = await api.get<APIResponse<Review[]>>("/me/reviews", { params });
  return { reviews: data.data, meta: data.meta as PageMeta };
}

export async function updateReview(reviewId: string, input: UpdateReviewInput) {
  const { data } = await api.patch<APIResponse<Review>>(`/reviews/${reviewId}`, input);
  return data.data;
}
