"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as adminService from "@/services/admin.service";

/** Every admin query starts with `admin`, so one invalidation after a write refreshes the lists, counts and details. */
export const adminKeys = {
  all: ["admin"] as const,
  overview: () => [...adminKeys.all, "overview"] as const,
  users: (params: adminService.AdminUserListParams) => [...adminKeys.all, "users", params] as const,
  user: (userId: string) => [...adminKeys.all, "user", userId] as const,
  suspensionRequests: (params: adminService.SuspensionRequestParams) =>
    [...adminKeys.all, "suspension-requests", params] as const,
  auditLogs: (params: adminService.AuditLogParams) => [...adminKeys.all, "audit-logs", params] as const,
  transactions: (params: adminService.AdminTransactionParams) => [...adminKeys.all, "transactions", params] as const,
  transaction: (invoiceId: string) => [...adminKeys.all, "transaction", invoiceId] as const,
  unmatched: (params: adminService.UnmatchedTransferParams) => [...adminKeys.all, "unmatched", params] as const,
  paymentSettings: () => [...adminKeys.all, "payment-settings"] as const,
};

export const useAdminOverview = () =>
  useQuery({ queryKey: adminKeys.overview(), queryFn: adminService.getAdminOverview });

export const useAdminUsers = (params: adminService.AdminUserListParams) =>
  useQuery({
    queryKey: adminKeys.users(params),
    queryFn: () => adminService.getAdminUsers(params),
    placeholderData: keepPreviousData,
  });

export const useAdminUser = (userId: string | undefined) =>
  useQuery({
    queryKey: adminKeys.user(userId ?? ""),
    queryFn: () => adminService.getAdminUser(userId!),
    enabled: !!userId,
  });

export const useSuspensionRequests = (params: adminService.SuspensionRequestParams) =>
  useQuery({
    queryKey: adminKeys.suspensionRequests(params),
    queryFn: () => adminService.getSuspensionRequests(params),
    placeholderData: keepPreviousData,
  });

export const useAuditLogs = (params: adminService.AuditLogParams) =>
  useQuery({
    queryKey: adminKeys.auditLogs(params),
    queryFn: () => adminService.getAuditLogs(params),
    placeholderData: keepPreviousData,
  });

export const useAdminTransactions = (params: adminService.AdminTransactionParams) =>
  useQuery({
    queryKey: adminKeys.transactions(params),
    queryFn: () => adminService.getAdminTransactions(params),
    placeholderData: keepPreviousData,
  });

export const useAdminTransaction = (invoiceId: string | undefined) =>
  useQuery({
    queryKey: adminKeys.transaction(invoiceId ?? ""),
    queryFn: () => adminService.getAdminTransaction(invoiceId!),
    enabled: !!invoiceId,
  });

export const useUnmatchedTransfers = (params: adminService.UnmatchedTransferParams) =>
  useQuery({
    queryKey: adminKeys.unmatched(params),
    queryFn: () => adminService.getUnmatchedTransfers(params),
    placeholderData: keepPreviousData,
  });

export const usePaymentSettings = () =>
  useQuery({ queryKey: adminKeys.paymentSettings(), queryFn: adminService.getPaymentSettings });

/**
 * One wrapper for every admin write. Refreshes all admin queries once the call settles, also on error: a conflict
 * code (…_STATUS_CONFLICT) means another admin changed the row. Use `isPending` to block a double submit.
 */
export function useAdminMutation<TData, TVars = void>(mutationFn: (vars: TVars) => Promise<TData>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSettled: () => queryClient.invalidateQueries({ queryKey: adminKeys.all }),
  });
}
