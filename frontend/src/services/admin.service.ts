import { api } from "@/lib/axios";
import type {
  AdminOverview,
  AdminTransaction,
  AdminTransactionDetail,
  AdminTransactionListQuery,
  AdminUser,
  AdminUserListQuery,
  AdminUserSummary,
  AuditLogEntry,
  AuditLogListQuery,
  InvitationResult,
  InviteAccountInput,
  PaymentSettings,
  PaymentSettingsCheck,
  SuspensionRequest,
  SuspensionRequestListQuery,
  UnmatchedTransfer,
  UnmatchedTransferListQuery,
} from "@stayreco/shared";
import type { APIResponse, PageMeta } from "@/types/response.type";

/**
 * Admin endpoints (docs/api/admin.md), `ADMIN` only. Every function returns the `data` of the envelope; lists return
 * `{ items, meta }`.
 */

async function getList<T>(url: string, params: object) {
  // Repeated filters go as `?status=A&status=B`, not `status[]`.
  const { data } = await api.get<APIResponse<T[]>>(url, { params, paramsSerializer: { indexes: null } });
  return { items: data.data, meta: data.meta as PageMeta };
}

export async function invitePlatformManager(input: InviteAccountInput) {
  const { data } = await api.post<APIResponse<InvitationResult>>("/auth/invitations/platform-manager", input);
  return data.data;
}

// ── Dashboard ───────────────────────────────────────────────

/** Without a period the backend reports the last 30 days. */
export async function getAdminOverview() {
  const { data } = await api.get<APIResponse<AdminOverview>>("/admin/stats");
  return data.data;
}

// ── Users and partners ──────────────────────────────────────

export type AdminUserListParams = Partial<AdminUserListQuery>;

export const getAdminUsers = (params: AdminUserListParams) => getList<AdminUserSummary>("/admin/users", params);

export async function getAdminUser(userId: string) {
  const { data } = await api.get<APIResponse<AdminUser>>(`/admin/users/${userId}`);
  return data.data;
}

async function postUser(url: string, body?: object) {
  const { data } = await api.post<APIResponse<AdminUser>>(url, body);
  return data.data;
}

/** Locks the account and signs it out everywhere; not for an admin account. */
export const suspendUser = (userId: string, reason: string) => postUser(`/admin/users/${userId}/suspend`, { reason });

export const activateUser = (userId: string, reason: string) =>
  postUser(`/admin/users/${userId}/activate`, { reason });

/** `partnerId` is the partner's account id. Applies to bookings made from now on (BR-13). */
export async function setCommissionRate(partnerId: string, rate: number) {
  const { data } = await api.patch<APIResponse<AdminUser>>(`/admin/partners/${partnerId}/commission-rate`, { rate });
  return data.data;
}

/** A suspended partner goes back to `APPROVED`. */
export const reinstatePartner = (partnerId: string, reason: string) =>
  postUser(`/admin/partners/${partnerId}/reinstate`, { reason });

// ── Suspension requests ─────────────────────────────────────

export type SuspensionRequestParams = Partial<SuspensionRequestListQuery>;

/** `PENDING` by default, oldest first. */
export const getSuspensionRequests = (params: SuspensionRequestParams) =>
  getList<SuspensionRequest>("/admin/suspension-requests", params);

export async function decideSuspensionRequest(requestId: string, decision: "approve" | "reject", reason: string) {
  const { data } = await api.post<APIResponse<SuspensionRequest>>(
    `/admin/suspension-requests/${requestId}/${decision}`,
    { reason },
  );
  return data.data;
}

// ── System logs ─────────────────────────────────────────────

export type AuditLogParams = Partial<AuditLogListQuery>;

/** Newest first; without a period the last 7 days, 92 days at most. */
export const getAuditLogs = (params: AuditLogParams) => getList<AuditLogEntry>("/admin/audit-logs", params);

// ── Transactions ────────────────────────────────────────────

export type AdminTransactionParams = Partial<AdminTransactionListQuery>;

/** One row per invoice, newest first; without a period the last 30 days. */
export const getAdminTransactions = (params: AdminTransactionParams) =>
  getList<AdminTransaction>("/admin/transactions", params);

export async function getAdminTransaction(invoiceId: string) {
  const { data } = await api.get<APIResponse<AdminTransactionDetail>>(`/admin/transactions/${invoiceId}`);
  return data.data;
}

export type UnmatchedTransferParams = Partial<UnmatchedTransferListQuery>;

/** SePay transfers that confirmed nothing or came late, to refund by hand. */
export const getUnmatchedTransfers = (params: UnmatchedTransferParams) =>
  getList<UnmatchedTransfer>("/admin/transactions/unmatched", params);

/** The `.xlsx` of the same filters as the list (at most 10,000 rows); `page` / `pageSize` are not sent. */
export async function exportAdminTransactions(params: AdminTransactionParams) {
  const { data } = await api.get<Blob>("/admin/transactions/export", {
    params: { ...params, page: undefined, pageSize: undefined },
    paramsSerializer: { indexes: null },
    responseType: "blob",
    timeout: 60_000,
  });
  return data;
}

// ── Payment settings (read-only, decision M10) ──────────────

export async function getPaymentSettings() {
  const { data } = await api.get<APIResponse<PaymentSettings>>("/admin/payment-settings");
  return data.data;
}

export async function testPaymentSettings() {
  const { data } = await api.post<APIResponse<PaymentSettingsCheck>>("/admin/payment-settings/test");
  return data.data;
}
