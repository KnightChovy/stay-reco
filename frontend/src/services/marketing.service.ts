import { api } from "@/lib/axios";
import type {
  AiBudget,
  BrandVoice,
  ContentIdea,
  ContentListQuery,
  ContentMetric,
  ContentSchedule,
  GenerateContentInput,
  MarketingContent,
  ScheduleContentInput,
  ScheduleListQuery,
  SocialAccount,
  UpdateContentInput,
} from "@stayreco/shared";
import type { APIResponse, PageMeta } from "@/types/response.type";

/**
 * Phase 5 AI marketing endpoints a hotel staff member uses (docs/api/marketing.md): ideas, the AI writer, editing and
 * submitting a draft, its picture, scheduling approved content and reading how a post did. Approving, connecting a
 * page and learning the brand voice belong to the owner and are not called from here.
 */

export type ContentListParams = Partial<ContentListQuery>;
export type ScheduleListParams = Partial<ScheduleListQuery>;

const repeated = { paramsSerializer: { indexes: null } };

// ── Voice and budget (read only for staff) ─────────────────

export async function getBrandVoice(hotelId: string) {
  const { data } = await api.get<APIResponse<BrandVoice>>(`/hotels/${hotelId}/brand-voice`);
  return data.data;
}

export async function getAiBudget(hotelId: string) {
  const { data } = await api.get<APIResponse<AiBudget>>(`/hotels/${hotelId}/ai-budget`);
  return data.data;
}

// ── Content ─────────────────────────────────────────────────

/** Database queries, not a model call: free to refresh. */
export async function getContentIdeas(hotelId: string) {
  const { data } = await api.get<APIResponse<ContentIdea[]>>(`/hotels/${hotelId}/marketing-content/ideas`);
  return data.data;
}

/** One model call, counted against the hotel's monthly AI budget. */
export async function generateContent(hotelId: string, input: GenerateContentInput) {
  const { data } = await api.post<APIResponse<MarketingContent>>(
    `/hotels/${hotelId}/marketing-content/generate`,
    input,
    // A model call takes longer than the default 15 s.
    { timeout: 60_000 },
  );
  return data.data;
}

export async function getContents(hotelId: string, params: ContentListParams = {}) {
  const { data } = await api.get<APIResponse<MarketingContent[]>>(`/hotels/${hotelId}/marketing-content`, {
    params,
    ...repeated,
  });
  return { contents: data.data, meta: data.meta as PageMeta };
}

export async function getContent(contentId: string) {
  const { data } = await api.get<APIResponse<MarketingContent>>(`/marketing-content/${contentId}`);
  return data.data;
}

/** Only while the piece is a DRAFT or REJECTED. */
export async function updateContent(contentId: string, input: UpdateContentInput) {
  const { data } = await api.patch<APIResponse<MarketingContent>>(`/marketing-content/${contentId}`, input);
  return data.data;
}

/** JPEG, PNG or WebP up to 10 MB; replaces the current picture. */
export async function uploadContentImage(contentId: string, file: File) {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post<APIResponse<MarketingContent>>(`/marketing-content/${contentId}/image`, form, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: 60_000,
  });
  return data.data;
}

export async function removeContentImage(contentId: string) {
  const { data } = await api.delete<APIResponse<MarketingContent>>(`/marketing-content/${contentId}/image`);
  return data.data;
}

/** DRAFT or REJECTED → PENDING_APPROVAL; the owner decides. */
export async function submitContent(contentId: string) {
  const { data } = await api.post<APIResponse<MarketingContent>>(`/marketing-content/${contentId}/submit`);
  return data.data;
}

export async function deleteContent(contentId: string) {
  await api.delete(`/marketing-content/${contentId}`);
}

// ── Pages, calendar and figures ─────────────────────────────

export async function getSocialAccounts(hotelId: string) {
  const { data } = await api.get<APIResponse<SocialAccount[]>>(`/hotels/${hotelId}/social-accounts`);
  return data.data;
}

/** Approved content only. No `scheduledAt` means the next run of the publisher, within a minute (M14). */
export async function scheduleContent(contentId: string, input: ScheduleContentInput) {
  const { data } = await api.post<APIResponse<ContentSchedule>>(`/marketing-content/${contentId}/schedule`, input);
  return data.data;
}

export async function getSchedules(hotelId: string, params: ScheduleListParams = {}) {
  const { data } = await api.get<APIResponse<ContentSchedule[]>>(`/hotels/${hotelId}/content-schedules`, {
    params,
    ...repeated,
  });
  return { schedules: data.data, meta: data.meta as PageMeta };
}

export async function cancelSchedule(scheduleId: string) {
  const { data } = await api.delete<APIResponse<ContentSchedule>>(`/content-schedules/${scheduleId}`);
  return data.data;
}

/** Every reading, newest first; each refresh appends one (M15). */
export async function getScheduleMetrics(scheduleId: string) {
  const { data } = await api.get<APIResponse<ContentMetric[]>>(`/content-schedules/${scheduleId}/metrics`);
  return data.data;
}

export async function refreshScheduleMetrics(scheduleId: string) {
  const { data } = await api.post<APIResponse<ContentMetric>>(`/content-schedules/${scheduleId}/metrics/refresh`);
  return data.data;
}
