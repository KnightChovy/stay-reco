import { api } from "@/lib/axios";
import type {
  ContentReport,
  DecideReportInput,
  ReportListQuery,
  Review,
  CreateViolationInput,
  EvidenceLink,
  PolicyViolation,
  PolicyViolationSummary,
  SuspensionRequestInput,
  UpdateViolationInput,
  UploadedEvidence,
  ViolationListQuery,
  CommissionListQuery,
  CommissionRow,
  PlatformCashflow,
  HotelRevenueDetail,
  HotelRevenueListQuery,
  HotelRevenueRow,
  PlatformExportQuery,
  PlatformRevenue,
  PlatformRevenueQuery,
  WalletTransaction,
  WalletTransactionListQuery,
  ManagerPayout,
  ManagerPayoutListQuery,
  PayoutPaidInput,
  PayoutRejectInput,
  PlatformHotelListQuery,
  PlatformHotelRow,
  PlatformOverview,
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

// ── Platform figures ────────────────────────────────────────

export type PlatformRangeParams = { from?: string; to?: string };

export async function getPlatformOverview(params: PlatformRangeParams) {
  const { data } = await api.get<APIResponse<PlatformOverview>>("/platform/stats/overview", { params });
  return data.data;
}

export type PlatformRevenueParams = Partial<PlatformRevenueQuery>;
export type HotelRevenueParams = Partial<HotelRevenueListQuery>;
export type HotelWalletParams = Partial<WalletTransactionListQuery>;

export async function getPlatformRevenue(params: PlatformRevenueParams) {
  const { data } = await api.get<APIResponse<PlatformRevenue>>("/platform/stats/revenue", { params });
  return data.data;
}

export async function getHotelRevenueList(params: HotelRevenueParams) {
  const { data } = await api.get<APIResponse<HotelRevenueRow[]>>("/platform/stats/revenue/hotels", { params });
  return { hotels: data.data, meta: data.meta as PageMeta };
}

export async function getHotelRevenue(hotelId: string, params: PlatformRangeParams) {
  const { data } = await api.get<APIResponse<HotelRevenueDetail>>(`/platform/hotels/${hotelId}/revenue`, { params });
  return data.data;
}

export async function getHotelWalletTransactions(hotelId: string, params: HotelWalletParams) {
  const { data } = await api.get<APIResponse<WalletTransaction[]>>(`/platform/hotels/${hotelId}/wallet/transactions`, {
    params,
    paramsSerializer: { indexes: null },
  });
  return { transactions: data.data, meta: data.meta as PageMeta };
}

export type CommissionParams = Partial<CommissionListQuery>;

export async function getCommissions(params: CommissionParams) {
  const { data } = await api.get<APIResponse<CommissionRow[]>>("/platform/commissions", {
    params,
    paramsSerializer: { indexes: null },
  });
  return { commissions: data.data, meta: data.meta as PageMeta };
}

export async function getCashflow(params: PlatformRangeParams) {
  const { data } = await api.get<APIResponse<PlatformCashflow>>("/platform/cashflow", { params });
  return data.data;
}

function attachmentName(disposition: unknown) {
  if (typeof disposition !== "string") return undefined;
  return /filename="?([^";]+)"?/i.exec(disposition)?.[1];
}

export async function exportPlatformReport(params: PlatformExportQuery) {
  const response = await api.get<Blob>("/platform/stats/export", {
    params,
    responseType: "blob",
    timeout: 60_000,
  });
  return { file: response.data, fileName: attachmentName(response.headers["content-disposition"]) };
}

export type PlatformHotelParams = Partial<PlatformHotelListQuery>;

export async function getPlatformHotels(params: PlatformHotelParams) {
  const { data } = await api.get<APIResponse<PlatformHotelRow[]>>("/platform/hotels", {
    params,
    paramsSerializer: { indexes: null },
  });
  return { hotels: data.data, meta: data.meta as PageMeta };
}

// ── Compliance cases ────────────────────────────────────────

export type ViolationParams = Partial<ViolationListQuery>;

export async function getViolations(params: ViolationParams) {
  const { data } = await api.get<APIResponse<PolicyViolationSummary[]>>("/policy-violations", {
    params,
    paramsSerializer: { indexes: null },
  });
  return { violations: data.data, meta: data.meta as PageMeta };
}

export async function getViolation(violationId: string) {
  const { data } = await api.get<APIResponse<PolicyViolation>>(`/policy-violations/${violationId}`);
  return data.data;
}

export async function createViolation(input: CreateViolationInput) {
  const { data } = await api.post<APIResponse<PolicyViolation>>("/policy-violations", input);
  return data.data;
}

export async function updateViolation(violationId: string, input: UpdateViolationInput) {
  const { data } = await api.patch<APIResponse<PolicyViolation>>(`/policy-violations/${violationId}`, input);
  return data.data;
}

export async function uploadViolationEvidence(file: File) {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post<APIResponse<UploadedEvidence>>("/policy-violations/evidence", form, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 60_000,
  });
  return data.data;
}

export async function getViolationEvidenceLink(violationId: string, index: number) {
  const { data } = await api.get<APIResponse<EvidenceLink>>(`/policy-violations/${violationId}/evidence/${index}`);
  return data.data;
}

export async function requestSuspension(violationId: string, input: SuspensionRequestInput) {
  const { data } = await api.post<APIResponse<PolicyViolation>>(
    `/policy-violations/${violationId}/suspension-request`,
    input,
  );
  return data.data;
}

// ── Content reports ─────────────────────────────────────────

export type ContentReportParams = Partial<ReportListQuery>;

export async function getContentReports(params: ContentReportParams) {
  const { data } = await api.get<APIResponse<ContentReport[]>>("/content-reports", {
    params,
    paramsSerializer: { indexes: null },
  });
  return { reports: data.data, meta: data.meta as PageMeta };
}

export async function decideContentReport(reportId: string, input: DecideReportInput) {
  const { data } = await api.post<APIResponse<ContentReport>>(`/content-reports/${reportId}/decide`, input);
  return data.data;
}

export async function setReviewVisibility(reviewId: string, isVisible: boolean) {
  const { data } = await api.patch<APIResponse<Review>>(`/reviews/${reviewId}/visibility`, { isVisible });
  return data.data;
}

const REVIEW_SCAN_PAGES = 3;

export async function findHotelReview(hotelId: string, reviewId: string) {
  for (let page = 1; page <= REVIEW_SCAN_PAGES; page += 1) {
    const { data } = await api.get<APIResponse<Review[]>>(`/hotels/${hotelId}/reviews`, {
      params: { page, pageSize: 100, sort: "newest" },
    });
    const found = data.data.find((review) => review.id === reviewId);
    if (found) return found;
    const meta = data.meta as PageMeta;
    if (page * meta.pageSize >= meta.total) break;
  }
  return null;
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
