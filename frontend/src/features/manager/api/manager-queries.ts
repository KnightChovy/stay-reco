"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import { getApiErrorCode, getApiErrorMessage } from "@/lib/api-error";
import * as managerService from "@/services/manager.service";
import { useManagerActions } from "../components/ManagerActionProvider";

export const managerKeys = {
  all: ["manager"] as const,
  verificationQueue: () => [...managerKeys.all, "verification-queue"] as const,
  verifications: (params: managerService.VerificationQueueParams) =>
    [...managerKeys.verificationQueue(), params] as const,
  verification: (requestId: string) => [...managerKeys.all, "verification", requestId] as const,
  payoutQueue: () => [...managerKeys.all, "payout-queue"] as const,
  payouts: (params: managerService.PayoutQueueParams) => [...managerKeys.payoutQueue(), params] as const,
  payout: (payoutId: string) => [...managerKeys.all, "payout", payoutId] as const,
  overview: (params: managerService.PlatformRangeParams) => [...managerKeys.all, "overview", params] as const,
  hotels: (params: managerService.PlatformHotelParams) => [...managerKeys.all, "hotels", params] as const,
  revenue: (params: managerService.PlatformRevenueParams) => [...managerKeys.all, "revenue", params] as const,
  revenueHotels: (params: managerService.HotelRevenueParams) =>
    [...managerKeys.all, "revenue-hotels", params] as const,
  hotelRevenue: (hotelId: string, params: managerService.PlatformRangeParams) =>
    [...managerKeys.all, "hotel-revenue", hotelId, params] as const,
  hotelWallet: (hotelId: string, params: managerService.HotelWalletParams) =>
    [...managerKeys.all, "hotel-wallet", hotelId, params] as const,
};

/** Codes whose shared message is written for the partner; the manager reads them from the other side. */
const managerErrorMessages: Record<string, string> = {
  PARTNER_SUSPENDED:
    "Đối tác đang bị tạm ngưng nên không thể duyệt hồ sơ xác minh lần đầu. Bạn vẫn có thể từ chối hoặc yêu cầu bổ sung.",
  HOTEL_STATUS_CONFLICT: "Chỉ yêu cầu tái xác minh được với khách sạn đang hoạt động.",
  VERIFICATION_PENDING: "Khách sạn đã có hồ sơ đang chờ thẩm định hoặc đã được yêu cầu tái xác minh.",
  PAYOUT_STATUS_CONFLICT:
    "Yêu cầu rút tiền này vừa được xử lý (bởi quản lý khác, hoặc đối tác đã huỷ). Dữ liệu đã được tải lại.",
  PAYOUT_NOT_FOUND: "Không tìm thấy yêu cầu rút tiền này.",
};

export function getManagerErrorMessage(error: unknown) {
  const code = getApiErrorCode(error);
  return (code && managerErrorMessages[code]) || getApiErrorMessage(error);
}

// ── Queries ─────────────────────────────────────────────────

export function useVerificationQueue(params: managerService.VerificationQueueParams) {
  return useQuery({
    queryKey: managerKeys.verifications(params),
    queryFn: () => managerService.getVerificationQueue(params),
    placeholderData: keepPreviousData,
  });
}

/** Number of requests waiting for a decision, for the tab badge. */
export function usePendingVerificationCount() {
  const query = useVerificationQueue({ status: "PENDING", page: 1, pageSize: 1 });
  return { ...query, count: query.data?.meta.total ?? 0 };
}

export function useVerificationRequest(requestId: string | undefined) {
  return useQuery({
    queryKey: managerKeys.verification(requestId ?? ""),
    queryFn: () => managerService.getVerificationRequest(requestId!),
    enabled: !!requestId,
  });
}

export function usePlatformOverview(params: managerService.PlatformRangeParams) {
  return useQuery({
    queryKey: managerKeys.overview(params),
    queryFn: () => managerService.getPlatformOverview(params),
    placeholderData: keepPreviousData,
  });
}

export function usePlatformRevenue(params: managerService.PlatformRevenueParams) {
  return useQuery({
    queryKey: managerKeys.revenue(params),
    queryFn: () => managerService.getPlatformRevenue(params),
    placeholderData: keepPreviousData,
  });
}

export function useHotelRevenueList(params: managerService.HotelRevenueParams) {
  return useQuery({
    queryKey: managerKeys.revenueHotels(params),
    queryFn: () => managerService.getHotelRevenueList(params),
    placeholderData: keepPreviousData,
  });
}

export function useHotelRevenue(hotelId: string | undefined, params: managerService.PlatformRangeParams) {
  return useQuery({
    queryKey: managerKeys.hotelRevenue(hotelId ?? "", params),
    queryFn: () => managerService.getHotelRevenue(hotelId!, params),
    enabled: !!hotelId,
  });
}

export function useHotelWalletTransactions(hotelId: string | undefined, params: managerService.HotelWalletParams) {
  return useQuery({
    queryKey: managerKeys.hotelWallet(hotelId ?? "", params),
    queryFn: () => managerService.getHotelWalletTransactions(hotelId!, params),
    enabled: !!hotelId,
    placeholderData: keepPreviousData,
  });
}

export function usePlatformHotels(params: managerService.PlatformHotelParams) {
  return useQuery({
    queryKey: managerKeys.hotels(params),
    queryFn: () => managerService.getPlatformHotels(params),
    placeholderData: keepPreviousData,
  });
}

export function usePayoutQueue(params: managerService.PayoutQueueParams) {
  return useQuery({
    queryKey: managerKeys.payouts(params),
    queryFn: () => managerService.getPayouts(params),
    placeholderData: keepPreviousData,
  });
}

export function usePendingPayoutCount() {
  const query = usePayoutQueue({ status: ["PENDING"], page: 1, pageSize: 1 });
  return { ...query, count: query.data?.meta.total ?? 0 };
}

export function usePayout(payoutId: string | undefined) {
  return useQuery({
    queryKey: managerKeys.payout(payoutId ?? ""),
    queryFn: () => managerService.getPayout(payoutId!),
    enabled: !!payoutId,
    staleTime: 0,
  });
}

// ── Mutations ───────────────────────────────────────────────

type ManagerMutationOptions<TData, TVars> = {
  /** Queries to refetch once the call settles. Also on error: a stale-data code (…_ALREADY_DECIDED) means the list changed. */
  invalidate: (vars: TVars) => QueryKey[];
  successMessage?: string | ((data: TData, vars: TVars) => string);
  /** Forms show their own (field-level) errors; everything else gets a notice. */
  errorNotice?: boolean;
  onSuccess?: (data: TData, vars: TVars) => void;
};

/**
 * One mutation wrapper for every manager write: shows the outcome as a notice and refreshes the affected queries.
 * Use `isPending` to disable the submit button so a double click sends one request.
 */
export function useManagerMutation<TData, TVars = void>(
  mutationFn: (vars: TVars) => Promise<TData>,
  { invalidate, successMessage, errorNotice = true, onSuccess }: ManagerMutationOptions<TData, TVars>,
) {
  const queryClient = useQueryClient();
  const { showNotice } = useManagerActions();

  return useMutation({
    mutationFn,
    onSuccess: (data, vars) => {
      if (successMessage) {
        showNotice(typeof successMessage === "function" ? successMessage(data, vars) : successMessage);
      }
      onSuccess?.(data, vars);
    },
    onError: (error) => {
      if (errorNotice) showNotice(getManagerErrorMessage(error), "error");
    },
    onSettled: (_data, _error, vars) =>
      Promise.all(invalidate(vars).map((queryKey) => queryClient.invalidateQueries({ queryKey }))),
  });
}
