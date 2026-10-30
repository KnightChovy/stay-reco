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
};

/** Codes whose shared message is written for the partner; the manager reads them from the other side. */
const managerErrorMessages: Record<string, string> = {
  PARTNER_SUSPENDED:
    "Đối tác đang bị tạm ngưng nên không thể duyệt hồ sơ xác minh lần đầu. Bạn vẫn có thể từ chối hoặc yêu cầu bổ sung.",
  HOTEL_STATUS_CONFLICT: "Chỉ yêu cầu tái xác minh được với khách sạn đang hoạt động.",
  VERIFICATION_PENDING: "Khách sạn đã có hồ sơ đang chờ thẩm định hoặc đã được yêu cầu tái xác minh.",
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
