"use client";

import { keepPreviousData, useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreateReviewInput,
  DiscountQuote,
  DiscountQuoteInput,
  ReviewListQuery,
  UpdateReviewInput,
  Voucher,
} from "@stayreco/shared";
import * as rewardsService from "@/services/rewards.service";
import type { PageParams, WalletTransactionParams } from "@/services/rewards.service";
import { bookingKeys } from "@/features/booking/api/booking-queries";

/** Query keys of the phase 4 customer screens: points, vouchers, wallet, preferences and reviews. */
export const rewardsKeys = {
  all: ["rewards"] as const,
  loyalty: () => [...rewardsKeys.all, "loyalty"] as const,
  loyaltyEntries: (params: PageParams) => [...rewardsKeys.all, "loyalty-entries", params] as const,
  vouchers: (params: PageParams & { active?: boolean }) => [...rewardsKeys.all, "vouchers", params] as const,
  wallet: () => [...rewardsKeys.all, "wallet"] as const,
  walletTransactions: (params: WalletTransactionParams) => [...rewardsKeys.all, "wallet-txns", params] as const,
  preferences: () => [...rewardsKeys.all, "preferences"] as const,
  discountQuote: (input: DiscountQuoteInput) => [...rewardsKeys.all, "discount-quote", input] as const,
  criteria: () => [...rewardsKeys.all, "rating-criteria"] as const,
  hotelReviews: (hotelId: string, params: Partial<ReviewListQuery>) =>
    [...rewardsKeys.all, "hotel-reviews", hotelId, params] as const,
  ratingSummary: (hotelId: string) => [...rewardsKeys.all, "rating-summary", hotelId] as const,
  eligibility: (bookingId: string) => [...rewardsKeys.all, "review-eligibility", bookingId] as const,
  myReviews: (params: Partial<ReviewListQuery>) => [...rewardsKeys.all, "my-reviews", params] as const,
};

// ── Loyalty & vouchers ──────────────────────────────────────

export function useMyLoyalty(enabled = true) {
  return useQuery({ queryKey: rewardsKeys.loyalty(), queryFn: rewardsService.getMyLoyalty, enabled, retry: false });
}

export function useMyLoyaltyEntries(params: PageParams) {
  return useQuery({
    queryKey: rewardsKeys.loyaltyEntries(params),
    queryFn: () => rewardsService.getMyLoyaltyEntries(params),
    placeholderData: keepPreviousData,
  });
}

export function useMyVouchers(params: PageParams & { active?: boolean }) {
  return useQuery({
    queryKey: rewardsKeys.vouchers(params),
    queryFn: () => rewardsService.getMyVouchers(params),
    placeholderData: keepPreviousData,
  });
}

/**
 * A quote is several backend queries and does not change while the form is open; the backend checks `expectedTotal`
 * again on `POST /bookings` anyway. So it is not re-asked on every return to the tab, which would also lock the
 * submit button while it reloads.
 */
const QUOTE_FRESHNESS = { staleTime: 30_000, refetchOnWindowFocus: false } as const;

/**
 * The price of a stay with the discount and points the customer chose. Re-run whenever the inputs change; it holds
 * nothing, so the booking form can call it freely. `retry: false` because a refused code is an answer, not a glitch.
 */
export function useDiscountQuote(input: DiscountQuoteInput | null) {
  return useQuery({
    queryKey: rewardsKeys.discountQuote(input ?? ({} as DiscountQuoteInput)),
    queryFn: () => rewardsService.getDiscountQuote(input!),
    enabled: !!input,
    retry: false,
    placeholderData: keepPreviousData,
    ...QUOTE_FRESHNESS,
  });
}

/**
 * At most this many codes are priced when the booking form opens: one quote per code. The soonest to expire go first;
 * any other code can still be typed in. A batch quote endpoint on the backend would remove the limit.
 */
export const MAX_PRICED_VOUCHERS = 10;

export type VoucherOption = {
  voucher: Voucher;
  /** The quote of the stay with this code alone (no points); undefined while loading. */
  quote: DiscountQuote | undefined;
  /** Why the backend refused the code for this stay (expired, minimum not reached…). */
  error: unknown;
  isLoading: boolean;
};

/**
 * The customer's usable codes for one stay, each priced by the backend (`POST /bookings/discount-quote`), so the
 * booking form can list what every code would save and pick the best without computing any discount itself.
 * Codes of another hotel are left out before asking.
 */
export function useVoucherOptions(stay: Omit<DiscountQuoteInput, "code" | "pointsToUse"> | null, hotelId: string) {
  const vouchersQuery = useQuery({
    queryKey: rewardsKeys.vouchers({ page: 1, pageSize: 100, active: true }),
    queryFn: () => rewardsService.getMyVouchers({ page: 1, pageSize: 100, active: true }),
    enabled: !!stay && !!hotelId,
    ...QUOTE_FRESHNESS,
  });
  const usable = (vouchersQuery.data?.vouchers ?? [])
    .filter((voucher) => voucher.usable && (voucher.hotelId === null || voucher.hotelId === hotelId))
    // Soonest to expire first; a code with no expiry last.
    .sort((a, b) => (a.expiresAt ?? "9999").localeCompare(b.expiresAt ?? "9999"));
  const vouchers = usable.slice(0, MAX_PRICED_VOUCHERS);

  const quotes = useQueries({
    queries: vouchers.map((voucher) => {
      const input = { ...stay!, code: voucher.code };
      return {
        queryKey: rewardsKeys.discountQuote(input),
        queryFn: () => rewardsService.getDiscountQuote(input),
        enabled: !!stay,
        retry: false,
        ...QUOTE_FRESHNESS,
      };
    }),
  });

  const options: VoucherOption[] = vouchers.map((voucher, index) => ({
    voucher,
    quote: quotes[index]?.data,
    error: quotes[index]?.error,
    isLoading: quotes[index]?.isLoading ?? true,
  }));

  return {
    options,
    /** Usable codes for this hotel that were not priced (beyond MAX_PRICED_VOUCHERS); they can be typed in. */
    hiddenCount: usable.length - vouchers.length,
    isLoading: !!stay && !!hotelId && (vouchersQuery.isLoading || options.some((option) => option.isLoading)),
  };
}

/** What a code takes off the stay; 0 when the hotel's own campaign saves more and the code would not be spent. */
export function voucherSaving(option: VoucherOption) {
  const discount = option.quote?.discount;
  return discount?.kind === "VOUCHER" && discount.code?.toUpperCase() === option.voucher.code.toUpperCase()
    ? discount.amount
    : 0;
}

// ── Wallet ──────────────────────────────────────────────────

export function useMyWallet(enabled = true) {
  return useQuery({ queryKey: rewardsKeys.wallet(), queryFn: rewardsService.getMyWallet, enabled });
}

export function useMyWalletTransactions(params: WalletTransactionParams) {
  return useQuery({
    queryKey: rewardsKeys.walletTransactions(params),
    queryFn: () => rewardsService.getMyWalletTransactions(params),
    placeholderData: keepPreviousData,
  });
}

export function usePayWithWallet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bookingId: string) => rewardsService.payWithWallet(bookingId),
    onSuccess: (_, bookingId) => {
      void queryClient.invalidateQueries({ queryKey: bookingKeys.detail(bookingId) });
      void queryClient.invalidateQueries({ queryKey: [...bookingKeys.all, "my-trips"] });
      void queryClient.invalidateQueries({ queryKey: rewardsKeys.wallet() });
      void queryClient.invalidateQueries({ queryKey: [...rewardsKeys.all, "wallet-txns"] });
    },
  });
}

// ── Preferences ─────────────────────────────────────────────

export function useMyPreferences() {
  return useQuery({ queryKey: rewardsKeys.preferences(), queryFn: rewardsService.getMyPreferences });
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (preferences: Record<string, string | null>) => rewardsService.updateMyPreferences(preferences),
    onSuccess: (preferences) => queryClient.setQueryData(rewardsKeys.preferences(), preferences),
  });
}

// ── Reviews ─────────────────────────────────────────────────

export function useRatingCriteria() {
  return useQuery({
    queryKey: rewardsKeys.criteria(),
    queryFn: rewardsService.getRatingCriteria,
    staleTime: 60 * 60 * 1000,
  });
}

export function useHotelReviews(hotelId: string | undefined, params: Partial<ReviewListQuery>) {
  return useQuery({
    queryKey: rewardsKeys.hotelReviews(hotelId ?? "", params),
    queryFn: () => rewardsService.getHotelReviews(hotelId!, params),
    enabled: !!hotelId,
    placeholderData: keepPreviousData,
  });
}

export function useHotelRatingSummary(hotelId: string | undefined) {
  return useQuery({
    queryKey: rewardsKeys.ratingSummary(hotelId ?? ""),
    queryFn: () => rewardsService.getHotelRatingSummary(hotelId!),
    enabled: !!hotelId,
  });
}

export function useReviewEligibility(bookingId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: rewardsKeys.eligibility(bookingId ?? ""),
    queryFn: () => rewardsService.getReviewEligibility(bookingId!),
    enabled: !!bookingId && enabled,
    retry: false,
  });
}

export function useMyReviews(params: Partial<ReviewListQuery>, enabled = true) {
  return useQuery({
    queryKey: rewardsKeys.myReviews(params),
    queryFn: () => rewardsService.getMyReviews(params),
    enabled,
    placeholderData: keepPreviousData,
  });
}

/** After writing or editing, the hotel page figures and the "write a review" button must follow. */
function useInvalidateReviews() {
  const queryClient = useQueryClient();
  return (bookingId: string, hotelId: string) => {
    void queryClient.invalidateQueries({ queryKey: rewardsKeys.eligibility(bookingId) });
    void queryClient.invalidateQueries({ queryKey: [...rewardsKeys.all, "my-reviews"] });
    void queryClient.invalidateQueries({ queryKey: [...rewardsKeys.all, "hotel-reviews", hotelId] });
    void queryClient.invalidateQueries({ queryKey: rewardsKeys.ratingSummary(hotelId) });
  };
}

export function useCreateReview() {
  const invalidate = useInvalidateReviews();
  return useMutation({
    mutationFn: ({ bookingId, input }: { bookingId: string; input: CreateReviewInput }) =>
      rewardsService.createReview(bookingId, input),
    onSuccess: (review) => invalidate(review.bookingId, review.hotelId),
  });
}

export function useUpdateReview() {
  const invalidate = useInvalidateReviews();
  return useMutation({
    mutationFn: ({ reviewId, input }: { reviewId: string; input: UpdateReviewInput }) =>
      rewardsService.updateReview(reviewId, input),
    onSuccess: (review) => invalidate(review.bookingId, review.hotelId),
  });
}
