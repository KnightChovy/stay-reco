import { api } from "@/lib/axios";
import type {
  ManagerPayout,
  ManagerPayoutListQuery,
  PayoutPaidInput,
  PayoutRejectInput,
  VerificationFileLink,
  VerificationListQuery,
  VerificationRequest,
  VerificationRequestSummary,
} from "@stayreco/shared";
import type { APIResponse, PageMeta } from "@/types/response.type";

/**
 * Platform manager endpoints (docs/api/manager.md). Every function returns the `data` of the envelope; list endpoints
 * with pagination also return `meta`.
 */

// ── Verification queue ──────────────────────────────────────

export type VerificationQueueParams = Partial<VerificationListQuery>;

/** Oldest first by default; `search` matches the hotel name. The queue has no beneficiary data. */
export async function getVerificationQueue(params: VerificationQueueParams) {
  const { data } = await api.get<APIResponse<VerificationRequestSummary[]>>("/verification-requests", { params });
  return { requests: data.data, meta: data.meta as PageMeta };
}

/** Full request, account and ID card numbers unmasked. */
export async function getVerificationRequest(requestId: string) {
  const { data } = await api.get<APIResponse<VerificationRequest>>(`/verification-requests/${requestId}`);
  return data.data;
}

/** A signed link valid for 5 minutes; ask for a new one every time. */
export async function getVerificationDocumentLink(documentId: string) {
  const { data } = await api.get<APIResponse<VerificationFileLink>>(`/verification-documents/${documentId}/file`);
  return data.data;
}

// ── Decisions (PENDING requests only) ───────────────────────

export async function approveVerification(requestId: string) {
  const { data } = await api.post<APIResponse<VerificationRequest>>(`/verification-requests/${requestId}/approve`);
  return data.data;
}

export async function rejectVerification(requestId: string, reason: string) {
  const { data } = await api.post<APIResponse<VerificationRequest>>(`/verification-requests/${requestId}/reject`, {
    reason,
  });
  return data.data;
}

export async function requestVerificationChanges(requestId: string, reason: string) {
  const { data } = await api.post<APIResponse<VerificationRequest>>(
    `/verification-requests/${requestId}/request-changes`,
    { reason },
  );
  return data.data;
}

/** Active hotels only: creates a `RENEWAL` request in `NEEDS_REVISION`; the hotel stays active meanwhile. */
export async function requestReverification(hotelId: string, reason: string) {
  const { data } = await api.post<APIResponse<VerificationRequest>>(`/hotels/${hotelId}/reverification`, { reason });
  return data.data;
}

// ── Withdrawals ─────────────────────────────────────────────

export type PayoutQueueParams = Partial<ManagerPayoutListQuery>;

export async function getPayouts(params: PayoutQueueParams) {
  const { data } = await api.get<APIResponse<ManagerPayout[]>>("/payouts", {
    params,
    paramsSerializer: { indexes: null },
  });
  return { payouts: data.data, meta: data.meta as PageMeta };
}

export async function getPayout(payoutId: string) {
  const { data } = await api.get<APIResponse<ManagerPayout>>(`/payouts/${payoutId}`);
  return data.data;
}

export async function markPayoutPaid(payoutId: string, input: PayoutPaidInput) {
  const { data } = await api.post<APIResponse<ManagerPayout>>(`/payouts/${payoutId}/paid`, input);
  return data.data;
}

export async function rejectPayout(payoutId: string, input: PayoutRejectInput) {
  const { data } = await api.post<APIResponse<ManagerPayout>>(`/payouts/${payoutId}/reject`, input);
  return data.data;
}
